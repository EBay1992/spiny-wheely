import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameBrandToSpinyWheely1718122000000 implements MigrationInterface {
  name = 'RenameBrandToSpinyWheely1718122000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET "email" = REPLACE("email", '@spinywinny.test', '@spinywheely.test')
      WHERE "email" LIKE '%@spinywinny.test'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET "email" = REPLACE("email", '@spinywheely.test', '@spinywinny.test')
      WHERE "email" LIKE '%@spinywheely.test'
    `);
  }
}
