import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { BetSession } from './entities/bet-session.entity';
import { GameConfiguration } from './entities/game-configuration.entity';
import { User } from './entities/user.entity';
import { Wallet } from './entities/wallet.entity';

async function run(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT ?? '5433', 10),
    username: process.env.DATABASE_USER ?? 'spinywheely',
    password: process.env.DATABASE_PASSWORD ?? 'spinywheely',
    database: process.env.DATABASE_NAME ?? 'spinywheely',
    entities: [User, Wallet, GameConfiguration, BetSession],
    migrations: [`${__dirname}/migrations/*.{ts,js}`],
    synchronize: false,
  });

  await dataSource.initialize();
  const applied = await dataSource.runMigrations();
  await dataSource.destroy();

  console.log(
    applied.length === 0
      ? 'No pending migrations.'
      : `Applied ${applied.length} migration(s).`,
  );
}

run().catch((error: Error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
