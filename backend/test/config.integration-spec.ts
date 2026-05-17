import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '../src/application/services/config.service';
import { GlobalConfig } from '../src/domain/types/global-config.type';
import { Config } from '../src/domain/entities/config.entity';

async function cleanDatabase(module: TestingModule) {
  const dataSource = module.get<DataSource>(getDataSourceToken());
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.query('TRUNCATE TABLE appointments, doctor_exceptions, patients, doctors, configs, users CASCADE');
  await queryRunner.release();
}

describe('ConfigService Integration', () => {
  let module: TestingModule;
  let service: ConfigService;
  let configRepo: Repository<Config>;

  beforeAll(async () => {
    process.env.DB_DATABASE = 'piedrazul_test';

    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: 'piedrazul_test',
          entities: [Config],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([Config]),
      ],
      providers: [ConfigService],
    }).compile();

    service = module.get(ConfigService);
    configRepo = module.get(getRepositoryToken(Config));
  });

  beforeEach(async () => {
    await cleanDatabase(module);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('onModuleInit', () => {
    it('debería crear la config por defecto si no existe', async () => {
      await service.onModuleInit();

      const config = await configRepo.findOneBy({ key: 'appointment_rules' });
      expect(config).toBeDefined();
      expect((config?.value as GlobalConfig).minAdvanceHours).toBe(2);
      expect((config?.value as GlobalConfig).appointmentWindowDays).toBe(15);
    });

    it('no debería sobrescribir si ya existe', async () => {
      await configRepo.save({
        key: 'appointment_rules',
        value: { minAdvanceHours: 5, appointmentWindowDays: 30 },
      });

      await service.onModuleInit();

      const config = await configRepo.findOneBy({ key: 'appointment_rules' });
      expect((config?.value as GlobalConfig).minAdvanceHours).toBe(5);
    });
  });

  describe('getConfig', () => {
    it('debería retornar undefined si no hay config', async () => {
      const result = await service.getConfig();
      expect(result).toBeUndefined();
    });

    it('debería retornar la config existente', async () => {
      await configRepo.save({
        key: 'appointment_rules',
        value: { minAdvanceHours: 2, appointmentWindowDays: 15 },
      });

      const result = await service.getConfig();
      expect(result).toBeDefined();
      expect(result?.minAdvanceHours).toBe(2);
      expect(result?.appointmentWindowDays).toBe(15);
    });
  });

  describe('updateConfig', () => {
    it('debería actualizar la configuración existente', async () => {
      await configRepo.save({
        key: 'appointment_rules',
        value: { minAdvanceHours: 2, appointmentWindowDays: 15 },
      });

      const result = await service.updateConfig({
        minAdvanceHours: 4,
        appointmentWindowDays: 30,
      });

      expect(result?.minAdvanceHours).toBe(4);
      expect(result?.appointmentWindowDays).toBe(30);
    });
  });
});
