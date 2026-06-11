import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MIN_WAGER, MAX_WAGER } from '../common/constants/wager.constants';
import { GameType } from '../common/enums/game-type.enum';
import { BetSession } from '../database/entities/bet-session.entity';
import { GameConfigurationService } from '../game-config/game-configuration.service';
import { User } from '../database/entities/user.entity';
import { WalletService } from '../wallet/wallet.service';
import {
  decodeBetHistoryCursor,
  encodeBetHistoryCursor,
} from './utils/cursor.util';

export interface PlayerProfile {
  id: string;
  email: string;
  createdAt: Date;
  wallet: {
    balance: string;
    currency: string;
    cached: boolean;
  };
}

export interface WagerHistoryItem {
  id: string;
  timestamp: Date;
  gameType: GameType;
  wagerAmount: string;
  payoutAmount: string;
  netResult: string;
}

export interface WagerHistoryPage {
  items: WagerHistoryItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PlayerGameInfo {
  gameType: GameType;
  targetRtp: string;
  houseEdge: string;
  volatility: string;
  isLive: boolean;
  minWager: number;
  maxWager: number;
}

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(BetSession)
    private readonly betSessionRepository: Repository<BetSession>,
    private readonly walletService: WalletService,
    private readonly gameConfigService: GameConfigurationService,
  ) {}

  async getProfile(playerId: string): Promise<PlayerProfile> {
    const player = await this.userRepository.findOne({ where: { id: playerId } });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    const wallet = await this.walletService.getBalance(playerId);

    return {
      id: player.id,
      email: player.email,
      createdAt: player.createdAt,
      wallet: {
        balance: wallet.balance,
        currency: wallet.currency,
        cached: wallet.fromCache ?? false,
      },
    };
  }

  async getGameInfo(): Promise<PlayerGameInfo> {
    const config = await this.gameConfigService.findByGameType(GameType.WHEEL);

    return {
      gameType: config.gameType,
      targetRtp: config.targetRtp,
      houseEdge: config.houseEdge,
      volatility: config.volatility,
      isLive: config.isLive,
      minWager: MIN_WAGER,
      maxWager: MAX_WAGER,
    };
  }

  async getWagerHistory(
    playerId: string,
    limit = 20,
    cursor?: string,
  ): Promise<WagerHistoryPage> {
    const pageSize = Math.min(Math.max(limit, 1), 50);

    const query = this.betSessionRepository
      .createQueryBuilder('session')
      .where('session.user_id = :playerId', { playerId })
      .orderBy('session.timestamp', 'DESC')
      .addOrderBy('session.id', 'DESC')
      .take(pageSize + 1);

    if (cursor) {
      let decoded;
      try {
        decoded = decodeBetHistoryCursor(cursor);
      } catch {
        throw new BadRequestException('Invalid cursor');
      }

      query.andWhere(
        `(session.timestamp < :cursorTimestamp OR (session.timestamp = :cursorTimestamp AND session.id < :cursorId))`,
        {
          cursorTimestamp: new Date(decoded.timestamp),
          cursorId: decoded.id,
        },
      );
    }

    const sessions = await query.getMany();
    const hasMore = sessions.length > pageSize;
    const pageItems = hasMore ? sessions.slice(0, pageSize) : sessions;

    const items: WagerHistoryItem[] = pageItems.map((session) => ({
      id: session.id,
      timestamp: session.timestamp,
      gameType: session.gameType,
      wagerAmount: session.betAmount,
      payoutAmount: session.winAmount,
      netResult: this.computeNetResult(session.betAmount, session.winAmount),
    }));

    const lastItem = pageItems[pageItems.length - 1];

    return {
      items,
      hasMore,
      nextCursor:
        hasMore && lastItem
          ? encodeBetHistoryCursor(lastItem.timestamp, lastItem.id)
          : null,
    };
  }

  private computeNetResult(wagerAmount: string, payoutAmount: string): string {
    const net = parseFloat(payoutAmount) - parseFloat(wagerAmount);
    return net.toFixed(2);
  }
}
