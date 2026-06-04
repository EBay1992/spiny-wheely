import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetPlayerPassword1718121900000 implements MigrationInterface {
  name = 'SetPlayerPassword1718121900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET "password_hash" = '$2a$10$yMwpAAaMaS0IEgOmx9p5AuY5oYMrOnYJ2XyLI4SK9NsbNUXNpTmaS'
      WHERE "email" = 'player@spinywheely.test'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET "password_hash" = 'dev-only-hash'
      WHERE "email" = 'player@spinywheely.test'
    `);
  }
}
