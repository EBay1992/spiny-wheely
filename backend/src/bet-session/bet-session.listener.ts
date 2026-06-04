import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BetSession } from '../database/entities/bet-session.entity';
import { BetSettledEvent } from '../wallet/events/bet-settled.event';

/** Persists settled wagers asynchronously from wallet domain events. */
@Injectable()
export class BetSessionListener {
  private readonly logger = new Logger(BetSessionListener.name);

  constructor(
    @InjectRepository(BetSession)
    private readonly betSessionRepository: Repository<BetSession>,
  ) {}

  @OnEvent('bet.settled', { async: true })
  async handleBetSettled(event: BetSettledEvent): Promise<void> {
    const betAmount = parseFloat(event.betAmount);
    const winAmount = parseFloat(event.winAmount);
    const netProfit = (betAmount - winAmount).toFixed(2);

    const session = this.betSessionRepository.create({
      userId: event.userId,
      gameType: event.gameType,
      betAmount: event.betAmount,
      winAmount: event.winAmount,
      netProfit,
    });

    await this.betSessionRepository.save(session);
    this.logger.debug(
      `Bet settled: user=${event.userId} key=${event.idempotencyKey}`,
    );
  }

}
