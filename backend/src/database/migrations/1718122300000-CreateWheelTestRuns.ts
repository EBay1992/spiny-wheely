import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWheelTestRuns1718122300000 implements MigrationInterface {
  name = 'CreateWheelTestRuns1718122300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "wheel_test_runs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "admin_user_id" uuid,
        "wager_amount" numeric(18,2) NOT NULL,
        "small_rotation" double precision NOT NULL,
        "middle_rotation" double precision NOT NULL,
        "big_rotation" double precision NOT NULL,
        "path" jsonb NOT NULL,
        "final_label" character varying(32) NOT NULL,
        "multiplier" double precision NOT NULL,
        "payout_amount" numeric(18,2) NOT NULL,
        "net_result" numeric(18,2) NOT NULL,
        "selected_segments" jsonb NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wheel_test_runs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wheel_test_runs_admin"
          FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_wheel_test_runs_created_at" ON "wheel_test_runs" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "wheel_test_runs"`);
  }
}
