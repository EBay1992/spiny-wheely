import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BetSession } from '../database/entities/bet-session.entity';
import { GameConfigModule } from '../game-config/game-config.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    AuthModule,
    GameConfigModule,
    TypeOrmModule.forFeature([BetSession]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
