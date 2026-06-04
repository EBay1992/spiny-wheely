import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1718121600000 implements MigrationInterface {
  name = 'InitialSchema1718121600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TYPE "public"."game_configurations_game_type_enum" AS ENUM('CRASH', 'WHEEL')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."game_configurations_volatility_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."bet_sessions_game_type_enum" AS ENUM('CRASH', 'WHEEL')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "balance" numeric(18,2) NOT NULL DEFAULT '0.00',
        "currency" character varying(3) NOT NULL DEFAULT 'USD',
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_wallets_user_id" UNIQUE ("user_id"),
        CONSTRAINT "PK_wallets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wallets_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_wallets_user_id" ON "wallets" ("user_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "game_configurations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "game_type" "public"."game_configurations_game_type_enum" NOT NULL,
        "target_rtp" numeric(5,2) NOT NULL,
        "volatility" "public"."game_configurations_volatility_enum" NOT NULL DEFAULT 'MEDIUM',
        "is_live" boolean NOT NULL DEFAULT false,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_game_configurations_game_type" UNIQUE ("game_type"),
        CONSTRAINT "PK_game_configurations" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_game_configurations_target_rtp" CHECK ("target_rtp" >= 80.0 AND "target_rtp" <= 99.5)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "bet_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "game_type" "public"."bet_sessions_game_type_enum" NOT NULL,
        "bet_amount" numeric(18,2) NOT NULL,
        "win_amount" numeric(18,2) NOT NULL DEFAULT '0.00',
        "net_profit" numeric(18,2) NOT NULL,
        "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bet_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bet_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_bet_sessions_user_id_timestamp" ON "bet_sessions" ("user_id", "timestamp")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_bet_sessions_timestamp" ON "bet_sessions" ("timestamp")
    `);

    await queryRunner.query(`
      INSERT INTO "game_configurations" ("game_type", "target_rtp", "volatility", "is_live")
      VALUES
        ('CRASH', 96.50, 'HIGH', false),
        ('WHEEL', 96.50, 'MEDIUM', false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "bet_sessions"`);
    await queryRunner.query(`DROP TABLE "game_configurations"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."bet_sessions_game_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."game_configurations_volatility_enum"`);
    await queryRunner.query(`DROP TYPE "public"."game_configurations_game_type_enum"`);
  }
}
