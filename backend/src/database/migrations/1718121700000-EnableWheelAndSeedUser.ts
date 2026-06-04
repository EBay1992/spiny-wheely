import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableWheelAndSeedUser1718121700000 implements MigrationInterface {
  name = 'EnableWheelAndSeedUser1718121700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "game_configurations"
      SET "is_live" = true
      WHERE "game_type" = 'WHEEL'
    `);

    await queryRunner.query(`
      INSERT INTO "users" ("email", "password_hash")
      VALUES ('player@spinywheely.test', 'dev-only-hash')
      ON CONFLICT ("email") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "wallets" ("user_id", "balance", "currency")
      SELECT u."id", '1000.00', 'USD'
      FROM "users" u
      WHERE u."email" = 'player@spinywheely.test'
      ON CONFLICT ("user_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "game_configurations"
      SET "is_live" = false
      WHERE "game_type" = 'WHEEL'
    `);

    await queryRunner.query(`
      DELETE FROM "wallets"
      WHERE "user_id" IN (
        SELECT "id" FROM "users" WHERE "email" = 'player@spinywheely.test'
      )
    `);

    await queryRunner.query(`
      DELETE FROM "users" WHERE "email" = 'player@spinywheely.test'
    `);
  }
}
