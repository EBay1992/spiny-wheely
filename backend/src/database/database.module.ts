import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BetSession } from './entities/bet-session.entity';
import { GameConfiguration } from './entities/game-configuration.entity';
import { User } from './entities/user.entity';
import { Wallet } from './entities/wallet.entity';
import { WheelTestRun } from './entities/wheel-test-run.entity';
import {
  resolvePostgresConnection,
  toTypeOrmOptions,
} from './connection-options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...toTypeOrmOptions(resolvePostgresConnection(), {
          max: config.get<number>('DATABASE_POOL_MAX', 10),
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 5_000,
        }),
        entities: [User, Wallet, GameConfiguration, BetSession, WheelTestRun],
        synchronize: config.get<string>('NODE_ENV') === 'development',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      Wallet,
      GameConfiguration,
      BetSession,
      WheelTestRun,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
