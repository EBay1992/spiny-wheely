import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { computeHouseEdge } from '../common/utils/house-edge.util';
import { GameType } from '../common/enums/game-type.enum';
import { GameConfiguration } from '../database/entities/game-configuration.entity';
import { REDIS_TTL, RedisKeys } from '../redis/redis.keys';
import { RedisService } from '../redis/redis.service';
import { UpdateGameConfigDto } from './dto/update-game-config.dto';

export interface GameConfigView {
  id: string;
  gameType: GameType;
  targetRtp: string;
  houseEdge: string;
  volatility: string;
  isLive: boolean;
  updatedAt: Date;
}

@Injectable()
export class GameConfigurationService {
  constructor(
    @InjectRepository(GameConfiguration)
    private readonly configRepository: Repository<GameConfiguration>,
    private readonly redis: RedisService,
  ) {}

  async findAll(): Promise<GameConfigView[]> {
    const configs = await this.configRepository.find({
      order: { gameType: 'ASC' },
    });
    return configs.map((config) => this.toView(config));
  }

  async findByGameType(gameType: GameType): Promise<GameConfigView> {
    const cacheKey = RedisKeys.gameConfig(gameType);
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as GameConfigView;
    }

    const config = await this.configRepository.findOne({
      where: { gameType },
    });

    if (!config) {
      throw new NotFoundException(`Game configuration not found: ${gameType}`);
    }

    const view = this.toView(config);
    await this.redis.set(
      cacheKey,
      JSON.stringify(view),
      REDIS_TTL.GAME_CONFIG_SECONDS,
    );

    return view;
  }

  async update(id: string, dto: UpdateGameConfigDto): Promise<GameConfigView> {
    const config = await this.configRepository.findOne({ where: { id } });

    if (!config) {
      throw new NotFoundException(`Game configuration not found: ${id}`);
    }

    if (dto.targetRtp !== undefined) {
      config.targetRtp = dto.targetRtp.toFixed(2);
    }
    if (dto.volatility !== undefined) {
      config.volatility = dto.volatility;
    }
    if (dto.isLive !== undefined) {
      config.isLive = dto.isLive;
    }

    const saved = await this.configRepository.save(config);
    const view = this.toView(saved);

    await this.invalidateCache(saved.gameType);

    return view;
  }

  async invalidateCache(gameType: GameType): Promise<void> {
    const cacheKey = RedisKeys.gameConfig(gameType);
    await this.redis.del(cacheKey);
    await this.redis.publish(
      `config:updated:${gameType}`,
      JSON.stringify({ gameType, updatedAt: new Date().toISOString() }),
    );
  }

  private toView(config: GameConfiguration): GameConfigView {
    return {
      id: config.id,
      gameType: config.gameType,
      targetRtp: config.targetRtp,
      houseEdge: computeHouseEdge(config.targetRtp),
      volatility: config.volatility,
      isLive: config.isLive,
      updatedAt: config.updatedAt,
    };
  }
}
