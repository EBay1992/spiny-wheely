import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BetSession } from './entities/bet-session.entity';
import { GameConfiguration } from './entities/game-configuration.entity';
import { User } from './entities/user.entity';
import { Wallet } from './entities/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DATABASE_HOST', '127.0.0.1'),
        port: config.get<number>('DATABASE_PORT', 5433),
        username: config.get<string>('DATABASE_USER', 'spinywheely'),
        password: config.get<string>('DATABASE_PASSWORD', 'spinywheely'),
        database: config.get<string>('DATABASE_NAME', 'spinywheely'),
        entities: [User, Wallet, GameConfiguration, BetSession],
        synchronize: config.get<string>('NODE_ENV') === 'development',
        logging: config.get<string>('NODE_ENV') === 'development',
        extra: {
          max: config.get<number>('DATABASE_POOL_MAX', 10),
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 5_000,
        },
      }),
    }),
    TypeOrmModule.forFeature([User, Wallet, GameConfiguration, BetSession]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
