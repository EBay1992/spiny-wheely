import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoleAndSeedAdmin1718121800000 implements MigrationInterface {
  name = 'AddUserRoleAndSeedAdmin1718121800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."users_role_enum" AS ENUM('PLAYER', 'ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "role" "public"."users_role_enum" NOT NULL DEFAULT 'PLAYER'
    `);

    await queryRunner.query(`
      INSERT INTO "users" ("email", "password_hash", "role")
      VALUES (
        'admin@spinywheely.test',
        '$2a$10$oKRfu/SLsa6B4TLwqgcQVuvU41Ehv0HXb7Er6jirWaK0wQGgmghk.',
        'ADMIN'
      )
      ON CONFLICT ("email") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "users" WHERE "email" = 'admin@spinywheely.test'
    `);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
