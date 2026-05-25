import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1779554759193 implements MigrationInterface {
  name = 'InitialSchema1779554759193';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Drop existing FK constraints ──────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "appointment_history" DROP CONSTRAINT IF EXISTS "FK_appointment_history_appointment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_history" DROP CONSTRAINT IF EXISTS "FK_492bdb7d7fff7082d957ad2757a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_exceptions" DROP CONSTRAINT IF EXISTS "FK_doctor_exceptions_doctor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_exceptions" DROP CONSTRAINT IF EXISTS "FK_0d5e948641820eaed2ce89f270b"`,
    );

    // ── Patients: VARCHAR(n) → VARCHAR ────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "patients" ALTER COLUMN "document" TYPE character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" ALTER COLUMN "first_name" TYPE character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" ALTER COLUMN "last_name" TYPE character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" ALTER COLUMN "phone" TYPE character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" ALTER COLUMN "gender" TYPE character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" ALTER COLUMN "email" TYPE character varying`,
    );

    // ── Patients: TIMESTAMP → TIMESTAMPTZ ─────────────────────────
    await queryRunner.query(
      `ALTER TABLE "patients" ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE USING "created_at"::TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE USING "updated_at"::TIMESTAMPTZ`,
    );

    // ── Appointments: VARCHAR(n) → VARCHAR ────────────────────────
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "status" TYPE character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "created_by" TYPE character varying`,
    );

    // ── Appointments: TIMESTAMP → TIMESTAMPTZ ─────────────────────
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE USING "created_at"::TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE USING "updated_at"::TIMESTAMPTZ`,
    );

    // ── Doctors: VARCHAR(n) → VARCHAR ─────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "doctors" ALTER COLUMN "name" TYPE character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctors" ALTER COLUMN "specialty" TYPE character varying`,
    );

    // ── Doctors: active_days VARCHAR → INTEGER[] (needs DROP/ADD) ─
    await queryRunner.query(
      `ALTER TABLE "doctors" ADD COLUMN "active_days_arr" integer[] DEFAULT '{1,2,3,4,5}'`,
    );
    await queryRunner.query(
      `UPDATE "doctors" SET "active_days_arr" = CASE WHEN "active_days" IS NOT NULL AND "active_days" != '' THEN string_to_array("active_days", ',')::int[] ELSE '{1,2,3,4,5}' END`,
    );
    await queryRunner.query(`ALTER TABLE "doctors" DROP COLUMN "active_days"`);
    await queryRunner.query(
      `ALTER TABLE "doctors" RENAME COLUMN "active_days_arr" TO "active_days"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctors" ALTER COLUMN "active_days" SET DEFAULT '{1,2,3,4,5}'`,
    );

    // ── Doctors: TIMESTAMP → TIMESTAMPTZ ─────────────────────────
    await queryRunner.query(
      `ALTER TABLE "doctors" ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE USING "created_at"::TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctors" ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE USING "updated_at"::TIMESTAMPTZ`,
    );

    // ── Configs: VARCHAR(n) → VARCHAR ────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "configs" ALTER COLUMN "key" TYPE character varying`,
    );

    // ── Configs: TIMESTAMP → TIMESTAMPTZ ─────────────────────────
    await queryRunner.query(
      `ALTER TABLE "configs" ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE USING "updated_at"::TIMESTAMPTZ`,
    );

    // ── Users: VARCHAR(n) → VARCHAR ─────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "email" TYPE character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "first_name" TYPE character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "last_name" TYPE character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE character varying`,
    );

    // ── Users: TIMESTAMP → TIMESTAMPTZ ───────────────────────────
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE USING "created_at"::TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE USING "updated_at"::TIMESTAMPTZ`,
    );

    // ── DoctorExceptions: TIMESTAMP → TIMESTAMPTZ ────────────────
    await queryRunner.query(
      `ALTER TABLE "doctor_exceptions" ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE USING "created_at"::TIMESTAMPTZ`,
    );

    // ── AppointmentHistory: VARCHAR(n) → VARCHAR ──────────────────
    await queryRunner.query(
      `ALTER TABLE "appointment_history" ALTER COLUMN "change_type" TYPE character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_history" ALTER COLUMN "previous_status" TYPE character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_history" ALTER COLUMN "new_status" TYPE character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_history" ALTER COLUMN "changed_by" TYPE character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_history" ALTER COLUMN "changed_by_role" TYPE character varying`,
    );

    // ── AppointmentHistory: TIMESTAMP → TIMESTAMPTZ ──────────────
    await queryRunner.query(
      `ALTER TABLE "appointment_history" ALTER COLUMN "changed_at" TYPE TIMESTAMP WITH TIME ZONE USING "changed_at"::TIMESTAMPTZ`,
    );

    // ── New indexes ─────────────────────────────────────────────
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_appointments_appointment_date" ON "appointments" ("appointment_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_appointments_patient_id" ON "appointments" ("patient_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_appointments_doctor_id" ON "appointments" ("doctor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_appointments_status" ON "appointments" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_doctors_active_days" ON "doctors" USING gin ("active_days")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_configs_value" ON "configs" USING gin ("value")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_doctor_exceptions_doctor" ON "doctor_exceptions" ("doctor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_appointment_history_appointment" ON "appointment_history" ("appointment_id")`,
    );

    // ── Clean existing data before adding CHECK constraints ─────
    await queryRunner.query(
      `UPDATE "patients" SET "gender" = 'F' WHERE "gender" NOT IN ('M', 'F', 'O')`,
    );
    await queryRunner.query(
      `UPDATE "patients" SET "gender" = 'O' WHERE "gender" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "patients" SET "email" = NULL WHERE "email" IS NOT NULL AND "email" !~ '^[^@]+@[^@]+$'`,
    );

    // ── CHECK constraints ─────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "patients" ADD CONSTRAINT "CHK_patients_document_length" CHECK (LENGTH("document") <= 20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" ADD CONSTRAINT "CHK_patients_first_name_length" CHECK (LENGTH("first_name") <= 100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" ADD CONSTRAINT "CHK_patients_last_name_length" CHECK (LENGTH("last_name") <= 100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" ADD CONSTRAINT "CHK_patients_phone_length" CHECK (LENGTH("phone") <= 20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" ADD CONSTRAINT "CHK_patients_gender" CHECK ("gender" IN ('M', 'F', 'O'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" ADD CONSTRAINT "CHK_patients_email" CHECK ("email" IS NULL OR "email" ~* '^[^@]+@[^@]+$')`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "CHK_appointments_status" CHECK ("status" IN ('agendada', 'confirmada', 'completada', 'cancelada'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctors" ADD CONSTRAINT "CHK_doctors_name_length" CHECK (LENGTH("name") <= 100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctors" ADD CONSTRAINT "CHK_doctors_specialty_length" CHECK (LENGTH("specialty") <= 100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "configs" ADD CONSTRAINT "CHK_configs_key_length" CHECK (LENGTH("key") <= 100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "configs" ADD CONSTRAINT "CHK_configs_value_json" CHECK (jsonb_typeof("value") = 'object')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_users_email_length" CHECK (LENGTH("email") <= 100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_users_first_name_length" CHECK (LENGTH("first_name") <= 100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_users_last_name_length" CHECK (LENGTH("last_name") <= 100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_users_role" CHECK ("role" IN ('admin', 'staff', 'doctor'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_history" ADD CONSTRAINT "CHK_ah_change_type_length" CHECK (LENGTH("change_type") <= 30)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_history" ADD CONSTRAINT "CHK_ah_previous_status_length" CHECK (LENGTH("previous_status") <= 20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_history" ADD CONSTRAINT "CHK_ah_new_status_length" CHECK (LENGTH("new_status") <= 20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_history" ADD CONSTRAINT "CHK_ah_changed_by_length" CHECK (LENGTH("changed_by") <= 100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_history" ADD CONSTRAINT "CHK_ah_changed_by_role_length" CHECK (LENGTH("changed_by_role") <= 30)`,
    );

    // ── FK constraints (with CASCADE where appropriate) ──────────────
    await queryRunner.query(
      `ALTER TABLE "appointment_history" ADD CONSTRAINT "FK_appointment_history_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_exceptions" ADD CONSTRAINT "FK_doctor_exceptions_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    // Recreate any missing default FKs for appointments
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_appointments_doctor') THEN
          ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointments_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_appointments_patient') THEN
          ALTER TABLE "appointments" ADD CONSTRAINT "FK_appointments_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: drop all CHECK constraints
    const checkConstraints = [
      'CHK_ah_changed_by_role_length',
      'CHK_ah_changed_by_length',
      'CHK_ah_new_status_length',
      'CHK_ah_previous_status_length',
      'CHK_ah_change_type_length',
      'CHK_users_role',
      'CHK_users_last_name_length',
      'CHK_users_first_name_length',
      'CHK_users_email_length',
      'CHK_configs_value_json',
      'CHK_configs_key_length',
      'CHK_doctors_specialty_length',
      'CHK_doctors_name_length',
      'CHK_appointments_status',
      'CHK_patients_email',
      'CHK_patients_gender',
      'CHK_patients_phone_length',
      'CHK_patients_last_name_length',
      'CHK_patients_first_name_length',
      'CHK_patients_document_length',
    ];
    for (const c of checkConstraints) {
      await queryRunner
        .query(
          `ALTER TABLE IF EXISTS "patients" DROP CONSTRAINT IF EXISTS "${c}"`,
        )
        .catch(() => {});
      await queryRunner
        .query(
          `ALTER TABLE IF EXISTS "appointments" DROP CONSTRAINT IF EXISTS "${c}"`,
        )
        .catch(() => {});
      await queryRunner
        .query(
          `ALTER TABLE IF EXISTS "doctors" DROP CONSTRAINT IF EXISTS "${c}"`,
        )
        .catch(() => {});
      await queryRunner
        .query(
          `ALTER TABLE IF EXISTS "configs" DROP CONSTRAINT IF EXISTS "${c}"`,
        )
        .catch(() => {});
      await queryRunner
        .query(`ALTER TABLE IF EXISTS "users" DROP CONSTRAINT IF EXISTS "${c}"`)
        .catch(() => {});
      await queryRunner
        .query(
          `ALTER TABLE IF EXISTS "appointment_history" DROP CONSTRAINT IF EXISTS "${c}"`,
        )
        .catch(() => {});
    }

    // Drop new indexes
    const indexes = [
      'IDX_appointment_history_appointment',
      'IDX_doctor_exceptions_doctor',
      'IDX_configs_value',
      'IDX_doctors_active_days',
      'IDX_appointments_status',
      'IDX_appointments_doctor_id',
      'IDX_appointments_patient_id',
      'IDX_appointments_appointment_date',
    ];
    for (const idx of indexes) {
      await queryRunner
        .query(`DROP INDEX IF EXISTS "public"."${idx}"`)
        .catch(() => {});
    }

    // Revert active_days: integer[] → varchar(50)
    await queryRunner.query(
      `ALTER TABLE "doctors" ADD COLUMN "active_days_str" character varying(50) DEFAULT '1,2,3,4,5'`,
    );
    await queryRunner.query(
      `UPDATE "doctors" SET "active_days_str" = array_to_string("active_days", ',')`,
    );
    await queryRunner.query(`ALTER TABLE "doctors" DROP COLUMN "active_days"`);
    await queryRunner.query(
      `ALTER TABLE "doctors" RENAME COLUMN "active_days_str" TO "active_days"`,
    );

    // Revert timestamptz → timestamp
    const revertTimestamptz = async (table: string, cols: string[]) => {
      for (const col of cols) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ALTER COLUMN "${col}" TYPE TIMESTAMP USING "${col}"::TIMESTAMP`,
        );
      }
    };
    await revertTimestamptz('patients', ['created_at', 'updated_at']);
    await revertTimestamptz('appointments', ['created_at', 'updated_at']);
    await revertTimestamptz('doctors', ['created_at', 'updated_at']);
    await revertTimestamptz('configs', ['updated_at']);
    await revertTimestamptz('users', ['created_at', 'updated_at']);
    await revertTimestamptz('doctor_exceptions', ['created_at']);
    await revertTimestamptz('appointment_history', ['changed_at']);
  }
}
