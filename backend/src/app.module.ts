import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { BetSessionModule } from './bet-session/bet-session.module';
import { DatabaseModule } from './database/database.module';
import { GameConfigModule } from './game-config/game-config.module';
import { WheelModule } from './games/wheel/wheel.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { PlayerModule } from './player/player.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    WalletModule,
    GameConfigModule,
    BetSessionModule,
    AdminModule,
    PlayerModule,
    WheelModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
