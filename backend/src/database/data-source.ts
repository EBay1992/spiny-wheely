import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();
import { BetSession } from './entities/bet-session.entity';
import { GameConfiguration } from './entities/game-configuration.entity';
import { User } from './entities/user.entity';
import { Wallet } from './entities/wallet.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? '127.0.0.1',
  port: parseInt(process.env.DATABASE_PORT ?? '5433', 10),
  username: process.env.DATABASE_USER ?? 'spinywheely',
  password: process.env.DATABASE_PASSWORD ?? 'spinywheely',
  database: process.env.DATABASE_NAME ?? 'spinywheely',
  entities: [User, Wallet, GameConfiguration, BetSession],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
