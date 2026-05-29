import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPatientMedicalFields20260527120000 implements MigrationInterface {
  name = 'AddPatientMedicalFields20260527120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "diagnosis" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "observations" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "observations" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "diagnosis" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN IF EXISTS "diagnosis"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN IF EXISTS "observations"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" DROP COLUMN IF EXISTS "observations"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" DROP COLUMN IF EXISTS "diagnosis"`,
    );
  }
}
