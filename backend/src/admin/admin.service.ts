import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameConfigView, GameConfigurationService } from '../game-config/game-configuration.service';
import { UpdateGameConfigDto } from '../game-config/dto/update-game-config.dto';
import { BetSession } from '../database/entities/bet-session.entity';

export interface PlatformMetrics {
  startDate: string;
  endDate: string;
  totalHandle: string;
  totalPayout: string;
  grossGamingRevenue: string;
  holdPercentage: string;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(BetSession)
    private readonly betSessionRepository: Repository<BetSession>,
    private readonly gameConfigurationService: GameConfigurationService,
  ) {}

  async getPlatformMetrics(
    startDate: string,
    endDate: string,
  ): Promise<PlatformMetrics> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    const aggregate = await this.betSessionRepository
      .createQueryBuilder('session')
      .select('COALESCE(SUM(session.bet_amount), 0)', 'totalHandle')
      .addSelect('COALESCE(SUM(session.win_amount), 0)', 'totalPayout')
      .where('session.timestamp >= :startDate', { startDate: start })
      .andWhere('session.timestamp <= :endDate', { endDate: end })
      .getRawOne<{ totalHandle: string; totalPayout: string }>();

    const totalHandle = parseFloat(aggregate?.totalHandle ?? '0');
    const totalPayout = parseFloat(aggregate?.totalPayout ?? '0');
    const grossGamingRevenue = totalHandle - totalPayout;
    const holdPercentage =
      totalHandle > 0 ? (grossGamingRevenue / totalHandle) * 100 : 0;

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalHandle: totalHandle.toFixed(2),
      totalPayout: totalPayout.toFixed(2),
      grossGamingRevenue: grossGamingRevenue.toFixed(2),
      holdPercentage: holdPercentage.toFixed(2),
    };
  }

  getGameConfigurations(): Promise<GameConfigView[]> {
    return this.gameConfigurationService.findAll();
  }

  updateGameConfiguration(
    id: string,
    dto: UpdateGameConfigDto,
  ): Promise<GameConfigView> {
    return this.gameConfigurationService.update(id, dto);
  }
}
