import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1780259350395 implements MigrationInterface {
  name = 'InitialSchema1780259350395';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "patients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "document" character varying NOT NULL, "keycloak_id" uuid, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "phone" character varying NOT NULL, "gender" character varying NOT NULL, "birth_date" date, "diagnosis" text, "observations" text, "email" character varying, "password" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_9572d422e2410ec39fd86f63a87" UNIQUE ("document"), CONSTRAINT "UQ_30b6e1b446f15fa02cc008bb81a" UNIQUE ("keycloak_id"), CONSTRAINT "CHK_117e53ce0580fc1bac520b36b7" CHECK ("email" IS NULL OR "email" ~* '^[^@]+@[^@]+$'), CONSTRAINT "CHK_d8e675d7c06b6489eb44aaca1f" CHECK ("gender" IN ('M', 'F', 'O')), CONSTRAINT "CHK_d7be258e4e756711be9df0be56" CHECK (LENGTH("phone") <= 20), CONSTRAINT "CHK_83e63cd2c12c498a8581624147" CHECK (LENGTH("last_name") <= 100), CONSTRAINT "CHK_39a128eed427767cb5cee17999" CHECK (LENGTH("first_name") <= 100), CONSTRAINT "CHK_5103c87d8363e974e6c538e723" CHECK (LENGTH("document") <= 20), CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "appointment_date" date NOT NULL, "appointment_time" TIME NOT NULL, "status" character varying NOT NULL DEFAULT 'agendada', "created_by" character varying, "observations" text, "diagnosis" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "doctor_id" uuid, "patient_id" uuid, CONSTRAINT "CHK_7670c952b4fc5f690efddf4658" CHECK ("status" IN ('agendada', 'confirmada', 'completada', 'cancelada')), CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e44a44b3eec38bb354c8425945" ON "appointments"  ("appointment_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3330f054416745deaa2cc13070" ON "appointments"  ("patient_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4cf26c3f972d014df5c68d503d" ON "appointments"  ("doctor_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8275d19f8ac53ea4ad1cf7c52d" ON "appointments"  ("doctor_id", "appointment_date", "appointment_time") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "must_change_password" boolean NOT NULL DEFAULT false, "keycloak_id" uuid, "password" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'staff', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_97b5061278a40c1dead71c1b889" UNIQUE ("keycloak_id"), CONSTRAINT "CHK_e7e58a5f0a08b056d8687f49a4" CHECK ("role" IN ('admin', 'staff', 'doctor')), CONSTRAINT "CHK_ec2048cfbd1f1b9b348791664a" CHECK (LENGTH("last_name") <= 100), CONSTRAINT "CHK_16c376c3ac1d77683ead0b1adb" CHECK (LENGTH("first_name") <= 100), CONSTRAINT "CHK_198b9ea03b6ce66450f15333cd" CHECK (LENGTH("email") <= 100), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "doctors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "document" character varying(20) NOT NULL, "name" character varying NOT NULL, "specialty" character varying, "email" character varying, "user_id" uuid, "schedule_start" TIME NOT NULL DEFAULT '08:00', "schedule_end" TIME NOT NULL DEFAULT '18:00', "slot_duration" integer NOT NULL DEFAULT '30', "lunch_start" TIME, "lunch_end" TIME, "active_days" integer array NOT NULL DEFAULT '{1,2,3,4,5}', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_dca587e3b020b63e80735f4dcbf" UNIQUE ("document"), CONSTRAINT "UQ_62069f52ebba471c91de5d59d61" UNIQUE ("email"), CONSTRAINT "REL_653c27d1b10652eb0c7bbbc442" UNIQUE ("user_id"), CONSTRAINT "CHK_58f7998f0aeaef51f4aaf9d2e2" CHECK (LENGTH("specialty") <= 100), CONSTRAINT "CHK_b814d245e7b537bdf2cc45593f" CHECK (LENGTH("name") <= 100), CONSTRAINT "PK_8207e7889b50ee3695c2b8154ff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ab11f69157b9293c7a8469ce3c" ON "doctors" USING gin ("active_days") `,
    );
    await queryRunner.query(
      `CREATE TABLE "configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "value" jsonb NOT NULL, "description" text, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_03f58fb0f3cccd983dded221bf5" UNIQUE ("key"), CONSTRAINT "CHK_4a82ab157259b470fc7b5ac74b" CHECK (jsonb_typeof("value") = 'object'), CONSTRAINT "CHK_43d942b9295476e89f8e09b571" CHECK (LENGTH("key") <= 100), CONSTRAINT "PK_002b633ec0d45f5c6f928fea292" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8c4f57f6e34c260a25ebf3c27c" ON "configs" USING gin ("value") `,
    );
    await queryRunner.query(
      `CREATE TABLE "doctor_exceptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "reason" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "doctor_id" uuid, CONSTRAINT "PK_6a30f0a58882e248f0eb89e3200" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0d5e948641820eaed2ce89f270" ON "doctor_exceptions"  ("doctor_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "appointment_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "change_type" character varying NOT NULL, "previous_date" date, "previous_time" character varying, "previous_status" character varying, "new_date" date, "new_time" character varying, "new_status" character varying, "changed_by" character varying NOT NULL, "changed_by_role" character varying NOT NULL, "reason" text, "changed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "appointment_id" uuid, CONSTRAINT "CHK_af3824c58546bda1c0a701a422" CHECK (LENGTH("changed_by_role") <= 30), CONSTRAINT "CHK_cf3b1b0dc767417c8c5f90c523" CHECK (LENGTH("changed_by") <= 100), CONSTRAINT "CHK_f464ba93889cf7c67173f928d9" CHECK (LENGTH("new_status") <= 20), CONSTRAINT "CHK_79338f2bfdf78d5d0b3525eccc" CHECK (LENGTH("previous_status") <= 20), CONSTRAINT "CHK_f3711fdf14e9a51bf85c52b45c" CHECK (LENGTH("change_type") <= 30), CONSTRAINT "PK_e2580899aa87ff1935c8d793181" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_492bdb7d7fff7082d957ad2757" ON "appointment_history"  ("appointment_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_4cf26c3f972d014df5c68d503d2" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_3330f054416745deaa2cc130700" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctors" ADD CONSTRAINT "FK_653c27d1b10652eb0c7bbbc4427" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_exceptions" ADD CONSTRAINT "FK_0d5e948641820eaed2ce89f270b" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointment_history" ADD CONSTRAINT "FK_492bdb7d7fff7082d957ad2757a" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "appointment_history" DROP CONSTRAINT "FK_492bdb7d7fff7082d957ad2757a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_exceptions" DROP CONSTRAINT "FK_0d5e948641820eaed2ce89f270b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctors" DROP CONSTRAINT "FK_653c27d1b10652eb0c7bbbc4427"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_3330f054416745deaa2cc130700"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_4cf26c3f972d014df5c68d503d2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_492bdb7d7fff7082d957ad2757"`,
    );
    await queryRunner.query(`DROP TABLE "appointment_history"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0d5e948641820eaed2ce89f270"`,
    );
    await queryRunner.query(`DROP TABLE "doctor_exceptions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8c4f57f6e34c260a25ebf3c27c"`,
    );
    await queryRunner.query(`DROP TABLE "configs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ab11f69157b9293c7a8469ce3c"`,
    );
    await queryRunner.query(`DROP TABLE "doctors"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8275d19f8ac53ea4ad1cf7c52d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4cf26c3f972d014df5c68d503d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3330f054416745deaa2cc13070"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e44a44b3eec38bb354c8425945"`,
    );
    await queryRunner.query(`DROP TABLE "appointments"`);
    await queryRunner.query(`DROP TABLE "patients"`);
  }
}
