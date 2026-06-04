import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameConfiguration } from '../database/entities/game-configuration.entity';
import { GameConfigurationService } from './game-configuration.service';

@Module({
  imports: [TypeOrmModule.forFeature([GameConfiguration])],
  providers: [GameConfigurationService],
  exports: [GameConfigurationService],
})
export class GameConfigModule {}
