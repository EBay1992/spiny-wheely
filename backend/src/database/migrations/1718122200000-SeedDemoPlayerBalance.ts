import { MigrationInterface, QueryRunner } from 'typeorm';

/** bcrypt hash for password: player123 */
const PLAYER_PASSWORD_HASH =
  '$2a$10$yMwpAAaMaS0IEgOmx9p5AuY5oYMrOnYJ2XyLI4SK9NsbNUXNpTmaS';

const DEMO_BALANCE = '5000.00';

/**
 * Seeds demo/test players with $5,000 USD — runs in development and production
 * when migrations are applied (local, Docker, Kubernetes migrate job).
 */
export class SeedDemoPlayerBalance1718122200000 implements MigrationInterface {
  name = 'SeedDemoPlayerBalance1718122200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const emails = ['player@spinywheely.test', 'demo@spinywheely.test'];

    for (const email of emails) {
      await queryRunner.query(
        `
        INSERT INTO "users" ("email", "password_hash", "role")
        VALUES ($1, $2, 'PLAYER')
        ON CONFLICT ("email") DO UPDATE
        SET "password_hash" = EXCLUDED."password_hash"
        `,
        [email, PLAYER_PASSWORD_HASH],
      );

      await queryRunner.query(
        `
        INSERT INTO "wallets" ("user_id", "balance", "currency")
        SELECT u."id", $2, 'USD'
        FROM "users" u
        WHERE u."email" = $1
        ON CONFLICT ("user_id") DO UPDATE
        SET "balance" = EXCLUDED."balance"
        `,
        [email, DEMO_BALANCE],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "wallets"
      WHERE "user_id" IN (
        SELECT "id" FROM "users" WHERE "email" = 'demo@spinywheely.test'
      )
    `);

    await queryRunner.query(`
      DELETE FROM "users" WHERE "email" = 'demo@spinywheely.test'
    `);

    await queryRunner.query(`
      UPDATE "wallets" w
      SET "balance" = '1000.00'
      FROM "users" u
      WHERE w."user_id" = u."id"
        AND u."email" = 'player@spinywheely.test'
    `);
  }
}
