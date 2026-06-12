import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();
import { BetSession } from './entities/bet-session.entity';
import { GameConfiguration } from './entities/game-configuration.entity';
import { User } from './entities/user.entity';
import { Wallet } from './entities/wallet.entity';
import { WheelTestRun } from './entities/wheel-test-run.entity';
import {
  resolvePostgresConnection,
  toTypeOrmOptions,
} from './connection-options';

export default new DataSource({
  ...toTypeOrmOptions(resolvePostgresConnection()),
  entities: [User, Wallet, GameConfiguration, BetSession, WheelTestRun],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
