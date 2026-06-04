import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MIN_WAGER, MAX_WAGER } from '../../common/constants/wager.constants';
import { GameType } from '../../common/enums/game-type.enum';
import { Volatility } from '../../common/enums/volatility.enum';
import { WheelRngEngine } from '../../game-math/wheel/wheel-rng.engine';
import { WheelSpinResult } from '../../game-math/wheel/wheel-spin-result.interface';
import {
  BIG_WHEEL_SEGMENTS,
  MIDDLE_WHEEL_SEGMENTS,
  segmentStopAngle,
  SMALL_WHEEL_SEGMENTS,
} from '../../game-math/wheel/wheel-segment.definitions';
import { GameConfigurationService } from '../../game-config/game-configuration.service';
import { REDIS_TTL, RedisKeys } from '../../redis/redis.keys';
import { RedisService } from '../../redis/redis.service';
import { WalletService } from '../../wallet/wallet.service';

export interface WheelSegmentView {
  index: number;
  label: string;
  multiplier: number;
  stopAngle: number;
  type: 'multiplier' | 'next_wheel';
}

export interface WheelTierPreview {
  wheel: 'small' | 'middle' | 'big';
  segments: WheelSegmentView[];
}

export interface WheelPreview {
  gameType: GameType;
  targetRtp: string;
  volatility: Volatility;
  wheels: WheelTierPreview[];
  isLive: boolean;
  minWager: number;
  maxWager: number;
}

@Injectable()
export class WheelService {
  private readonly logger = new Logger(WheelService.name);
  private readonly rngEngine = new WheelRngEngine();

  constructor(
    private readonly gameConfigService: GameConfigurationService,
    private readonly walletService: WalletService,
    private readonly redis: RedisService,
  ) {}

  async getPreview(): Promise<WheelPreview> {
    const config = await this.gameConfigService.findByGameType(GameType.WHEEL);

    return {
      gameType: GameType.WHEEL,
      targetRtp: config.targetRtp,
      volatility: config.volatility as Volatility,
      wheels: [
        { wheel: 'small', segments: this.toPublicSegments(SMALL_WHEEL_SEGMENTS) },
        { wheel: 'middle', segments: this.toPublicSegments(MIDDLE_WHEEL_SEGMENTS) },
        { wheel: 'big', segments: this.toPublicSegments(BIG_WHEEL_SEGMENTS) },
      ],
      isLive: config.isLive,
      minWager: MIN_WAGER,
      maxWager: MAX_WAGER,
    };
  }

  /**
   * Resolves a full 3-tier wheel round server-side: NEXT advances tiers,
   * 0x forfeits the wager, multipliers settle as payout.
   */
  async spin(playerId: string, wagerAmount: number): Promise<WheelSpinResult> {
    this.assertWagerInRange(wagerAmount);

    const config = await this.gameConfigService.findByGameType(GameType.WHEEL);
    if (!config.isLive) {
      throw new ServiceUnavailableException('Wheel game is not live');
    }

    const wager = wagerAmount.toFixed(2);
    const roundId = randomUUID();
    const idempotencyKey = `${playerId}:${roundId}`;

    const outcome = this.rngEngine.resolveRound(
      parseFloat(config.targetRtp),
      config.volatility as Volatility,
    );
    const payout = this.computePayout(wager, outcome.finalMultiplier);

    const wallet = await this.walletService.settleBet(
      playerId,
      wager,
      payout,
      GameType.WHEEL,
      idempotencyKey,
    );

    const result: WheelSpinResult = {
      roundId,
      path: outcome.path,
      label: outcome.finalLabel,
      multiplier: outcome.finalMultiplier,
      wagerAmount: wager,
      payoutAmount: payout,
      balance: wallet.balance,
      currency: wallet.currency,
    };

    await this.persistRoundState(result, playerId);
    this.logger.debug(
      `Wheel round=${roundId} player=${playerId} path=${outcome.path.map((p) => p.label).join('→')} payout=${payout}`,
    );

    return result;
  }

  private assertWagerInRange(wagerAmount: number): void {
    if (wagerAmount < MIN_WAGER || wagerAmount > MAX_WAGER) {
      throw new BadRequestException(
        `Wager must be between ${MIN_WAGER} and ${MAX_WAGER}`,
      );
    }
  }

  private computePayout(wager: string, multiplier: number): string {
    return (parseFloat(wager) * multiplier).toFixed(2);
  }

  private toPublicSegments(
    segments: typeof SMALL_WHEEL_SEGMENTS,
  ): WheelSegmentView[] {
    return segments.map((segment) => ({
      index: segment.index,
      label: segment.label,
      multiplier: segment.multiplier,
      stopAngle: segmentStopAngle(segment),
      type: segment.type,
    }));
  }

  private async persistRoundState(
    result: WheelSpinResult,
    playerId: string,
  ): Promise<void> {
    const payload = JSON.stringify({
      ...result,
      playerId,
      resolvedAt: new Date().toISOString(),
    });

    await Promise.all([
      this.redis.set(
        RedisKeys.wheelRound(result.roundId),
        payload,
        REDIS_TTL.WHEEL_ROUND_SECONDS,
      ),
      this.redis.set(
        RedisKeys.wheelState(),
        payload,
        REDIS_TTL.WHEEL_STATE_SECONDS,
      ),
    ]).catch((error: Error) => {
      this.logger.warn(`Failed to persist wheel state in Redis: ${error.message}`);
    });
  }
}
