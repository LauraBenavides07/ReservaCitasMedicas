import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiagnosisAndObservationsToPatient1779562800000
  implements MigrationInterface
{
  name = 'AddDiagnosisAndObservationsToPatient1779562800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "patients" ADD COLUMN "diagnosis" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" ADD COLUMN "observations" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "patients" DROP COLUMN "observations"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" DROP COLUMN "diagnosis"`,
    );
  }
}
