import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, EntityManager } from 'typeorm';
import { REDIS_TTL, RedisKeys } from '../redis/redis.keys';
import { RedisService } from '../redis/redis.service';
import { Wallet } from '../database/entities/wallet.entity';
import { InsufficientBalanceException } from './exceptions/insufficient-balance.exception';
import { WalletNotFoundException } from './exceptions/wallet-not-found.exception';
import { BetPlacedEvent } from './events/bet-placed.event';
import { BetSettledEvent } from './events/bet-settled.event';
import { GameType } from '../common/enums/game-type.enum';

export interface WalletOperationResult {
  walletId: string;
  userId: string;
  balance: string;
  currency: string;
  fromCache?: boolean;
}

@Injectable()
export class WalletService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly redis: RedisService,
  ) {}

  async getBalance(userId: string): Promise<WalletOperationResult> {
    const cached = await this.readBalanceCache(userId);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    const result = await this.getBalanceFromDatabase(userId);
    await this.writeBalanceCache(result);
    return { ...result, fromCache: false };
  }

  private async getBalanceFromDatabase(
    userId: string,
  ): Promise<WalletOperationResult> {
    const wallet = await this.dataSource.getRepository(Wallet).findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new WalletNotFoundException(userId);
    }

    return this.toResult(wallet);
  }

  /**
   * Atomically debit a wallet using SELECT FOR UPDATE pessimistic locking.
   * Safe for concurrent WebSocket bet placements.
   */
  async debit(
    userId: string,
    amount: string,
    options?: {
      gameType?: GameType;
      idempotencyKey?: string;
      manager?: EntityManager;
    },
  ): Promise<WalletOperationResult> {
    const execute = async (manager: EntityManager) => {
      const wallet = await this.lockWallet(manager, userId);

      if (this.compareDecimal(wallet.balance, amount) < 0) {
        throw new InsufficientBalanceException(userId, amount, wallet.balance);
      }

      wallet.balance = this.subtractDecimal(wallet.balance, amount);
      const saved = await manager.save(Wallet, wallet);

      if (options?.gameType && options?.idempotencyKey) {
        this.eventEmitter.emit(
          'bet.placed',
          new BetPlacedEvent(
            userId,
            options.gameType,
            amount,
            options.idempotencyKey,
          ),
        );
      }

      const result = this.toResult(saved);
      if (!options?.manager) {
        await this.writeBalanceCache(result);
      }
      return result;
    };

    if (options?.manager) {
      return execute(options.manager);
    }

    return this.dataSource.transaction(execute);
  }

  /**
   * Atomically credit a wallet using SELECT FOR UPDATE pessimistic locking.
   */
  async credit(
    userId: string,
    amount: string,
    options?: {
      gameType?: GameType;
      betAmount?: string;
      idempotencyKey?: string;
      manager?: EntityManager;
    },
  ): Promise<WalletOperationResult> {
    const execute = async (manager: EntityManager) => {
      const wallet = await this.lockWallet(manager, userId);
      wallet.balance = this.addDecimal(wallet.balance, amount);
      const saved = await manager.save(Wallet, wallet);

      if (
        options?.gameType &&
        options?.betAmount &&
        options?.idempotencyKey
      ) {
        this.eventEmitter.emit(
          'bet.settled',
          new BetSettledEvent(
            userId,
            options.gameType,
            options.betAmount,
            amount,
            options.idempotencyKey,
          ),
        );
      }

      const result = this.toResult(saved);
      if (!options?.manager) {
        await this.writeBalanceCache(result);
      }
      return result;
    };

    if (options?.manager) {
      return execute(options.manager);
    }

    return this.dataSource.transaction(execute);
  }

  /**
   * Debit bet and credit winnings in a single atomic transaction.
   */
  async settleBet(
    userId: string,
    betAmount: string,
    winAmount: string,
    gameType: GameType,
    idempotencyKey: string,
  ): Promise<WalletOperationResult> {
    const result = await this.dataSource.transaction(async (manager) => {
      await this.debit(userId, betAmount, {
        gameType,
        idempotencyKey,
        manager,
      });

      if (this.compareDecimal(winAmount, '0') > 0) {
        return this.credit(userId, winAmount, {
          gameType,
          betAmount,
          idempotencyKey,
          manager,
        });
      }

      this.eventEmitter.emit(
        'bet.settled',
        new BetSettledEvent(
          userId,
          gameType,
          betAmount,
          '0.00',
          idempotencyKey,
        ),
      );

      const wallet = await this.lockWallet(manager, userId);
      return this.toResult(wallet);
    });

    await this.writeBalanceCache(result);
    return result;
  }

  private async lockWallet(
    manager: EntityManager,
    userId: string,
  ): Promise<Wallet> {
    const wallet = await manager
      .createQueryBuilder(Wallet, 'wallet')
      .setLock('pessimistic_write')
      .where('wallet.user_id = :userId', { userId })
      .getOne();

    if (!wallet) {
      throw new WalletNotFoundException(userId);
    }

    return wallet;
  }

  private toResult(wallet: Wallet): WalletOperationResult {
    return {
      walletId: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance,
      currency: wallet.currency,
    };
  }

  private compareDecimal(a: string, b: string): number {
    const diff = parseFloat(a) - parseFloat(b);
    if (Math.abs(diff) < 0.005) return 0;
    return diff > 0 ? 1 : -1;
  }

  private addDecimal(a: string, b: string): string {
    return (parseFloat(a) + parseFloat(b)).toFixed(2);
  }

  private subtractDecimal(a: string, b: string): string {
    return (parseFloat(a) - parseFloat(b)).toFixed(2);
  }

  private async readBalanceCache(
    userId: string,
  ): Promise<WalletOperationResult | null> {
    const raw = await this.redis.get(RedisKeys.walletBalance(userId));
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as WalletOperationResult;
  }

  private async writeBalanceCache(
    result: WalletOperationResult,
  ): Promise<void> {
    await this.redis.set(
      RedisKeys.walletBalance(result.userId),
      JSON.stringify({
        walletId: result.walletId,
        userId: result.userId,
        balance: result.balance,
        currency: result.currency,
      }),
      REDIS_TTL.WALLET_BALANCE_SECONDS,
    );
  }
}
