import { MigrationInterface, QueryRunner } from 'typeorm';

/** Dedicated players for high-traffic load tests (one wallet per concurrent worker). */
const PLAYER_PASSWORD_HASH =
  '$2a$10$yMwpAAaMaS0IEgOmx9p5AuY5oYMrOnYJ2XyLI4SK9NsbNUXNpTmaS';
const LOAD_PLAYER_COUNT = 50;
const LOAD_PLAYER_BALANCE = '50000.00';

export class SeedLoadTestPlayers1718122100000 implements MigrationInterface {
  name = 'SeedLoadTestPlayers1718122100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (let index = 1; index <= LOAD_PLAYER_COUNT; index += 1) {
      const email = `load-player-${String(index).padStart(2, '0')}@spinywheely.test`;

      await queryRunner.query(
        `
        INSERT INTO "users" ("email", "password_hash", "role")
        VALUES ($1, $2, 'PLAYER')
        ON CONFLICT ("email") DO NOTHING
      `,
        [email, PLAYER_PASSWORD_HASH],
      );

      await queryRunner.query(
        `
        INSERT INTO "wallets" ("user_id", "balance", "currency")
        SELECT u."id", $2, 'USD'
        FROM "users" u
        WHERE u."email" = $1
        ON CONFLICT ("user_id") DO NOTHING
      `,
        [email, LOAD_PLAYER_BALANCE],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (let index = 1; index <= LOAD_PLAYER_COUNT; index += 1) {
      const email = `load-player-${String(index).padStart(2, '0')}@spinywheely.test`;

      await queryRunner.query(
        `
        DELETE FROM "wallets"
        WHERE "user_id" IN (SELECT "id" FROM "users" WHERE "email" = $1)
      `,
        [email],
      );

      await queryRunner.query(`DELETE FROM "users" WHERE "email" = $1`, [email]);
    }
  }
}
