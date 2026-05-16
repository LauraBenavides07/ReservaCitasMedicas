import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DoctorService } from '../src/application/services/doctor.service';
import { Doctor } from '../src/domain/entities/doctor.entity';
import { Appointment } from '../src/domain/entities/appointment.entity';
import { DoctorException } from '../src/domain/entities/doctor-exception.entity';
import { Patient } from '../src/domain/entities/patient.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

async function cleanDatabase(module: TestingModule) {
  const dataSource = module.get<DataSource>(getDataSourceToken());
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.query('TRUNCATE TABLE appointments, doctor_exceptions, patients, doctors, configs, users CASCADE');
  await queryRunner.release();
}

describe('DoctorService Integration', () => {
  let module: TestingModule;
  let service: DoctorService;
  let doctorRepo: Repository<Doctor>;
  let appointmentRepo: Repository<Appointment>;
  let patientRepo: Repository<Patient>;
  let doctorId: string;

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
          entities: [Doctor, Appointment, DoctorException, Patient],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([Doctor, Appointment, DoctorException, Patient]),
      ],
      providers: [DoctorService],
    }).compile();

    service = module.get(DoctorService);
    doctorRepo = module.get(getRepositoryToken(Doctor));
    appointmentRepo = module.get(getRepositoryToken(Appointment));
    patientRepo = module.get(getRepositoryToken(Patient));
  });

  beforeEach(async () => {
    await cleanDatabase(module);
    const doctor = await doctorRepo.save({
      name: 'Dr. Test',
      specialty: 'Cardiología',
      scheduleStart: '08:00',
      scheduleEnd: '17:00',
      slotDuration: 30,
      lunchStart: '12:00',
      lunchEnd: '13:00',
      activeDays: '1,2,3,4,5,6,7',
    });
    doctorId = doctor.id;
  });

  afterAll(async () => {
    await module.close();
  });

  describe('findAll', () => {
    it('debería retornar todos los doctores', async () => {
      const doctors = await service.findAll();
      expect(doctors.length).toBe(1);
      expect(doctors[0].name).toBe('Dr. Test');
    });

    it('debería retornar array vacío si no hay doctores', async () => {
      await cleanDatabase(module);
      const doctors = await service.findAll();
      expect(doctors).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('debería retornar un doctor por ID', async () => {
      const doctor = await service.findOne(doctorId);
      expect(doctor.name).toBe('Dr. Test');
      expect(doctor.specialty).toBe('Cardiología');
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      await expect(
        service.findOne('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('debería crear un doctor y persistirlo', async () => {
      const result = await service.create({
        name: 'Dra. López',
        specialty: 'Pediatría',
        scheduleStart: '09:00',
        scheduleEnd: '16:00',
        slotDuration: 20,
        activeDays: '1,2,3,4,5',
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Dra. López');

      const saved = await doctorRepo.findOneBy({ id: result.id });
      expect(saved?.name).toBe('Dra. López');
    });
  });

  describe('update', () => {
    it('debería actualizar un doctor existente', async () => {
      const result = await service.update(doctorId, { specialty: 'Cirugía General' });

      expect(result.specialty).toBe('Cirugía General');

      const saved = await doctorRepo.findOneBy({ id: doctorId });
      expect(saved?.specialty).toBe('Cirugía General');
    });

    it('debería lanzar NotFoundException si el doctor no existe', async () => {
      await expect(
        service.update('00000000-0000-0000-0000-000000000000', { name: 'No existe' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('debería eliminar un doctor sin citas', async () => {
      await service.remove(doctorId);
      const deleted = await doctorRepo.findOneBy({ id: doctorId });
      expect(deleted).toBeNull();
    });

    it('debería lanzar BadRequestException si el doctor tiene citas agendadas', async () => {
      const patient = await patientRepo.save({
        document: '99999999',
        firstName: 'P',
        lastName: 'T',
        phone: '300',
        gender: 'M',
      });
      await appointmentRepo.save({
        appointmentDate: '2026-06-01',
        appointmentTime: '10:00',
        doctor: { id: doctorId },
        patient,
        status: 'agendada',
      });

      await expect(service.remove(doctorId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('exceptions', () => {
    it('addException debería persistir una excepción', async () => {
      const exc = await service.addException({
        doctorId,
        date: '2026-12-25',
        reason: 'Navidad',
      });

      expect(exc.id).toBeDefined();
      expect(exc.reason).toBe('Navidad');
    });

    it('getExceptions debería retornar excepciones ordenadas por fecha', async () => {
      const excRepo = module.get(getRepositoryToken(DoctorException));
      await excRepo.save([
        { doctorId, date: '2026-12-25', reason: 'Navidad' },
        { doctorId, date: '2026-12-24', reason: 'Nochebuena' },
      ]);

      const exceptions = await service.getExceptions(doctorId);
      expect(exceptions.length).toBe(2);
      expect(exceptions[0].reason).toBe('Nochebuena');
      expect(exceptions[1].reason).toBe('Navidad');
    });

    it('removeException debería eliminar una excepción', async () => {
      const excRepo = module.get(getRepositoryToken(DoctorException));
      const exc = await excRepo.save({ doctorId, date: '2026-12-25', reason: 'Navidad' });

      await service.removeException(exc.id);
      const deleted = await excRepo.findOneBy({ id: exc.id });
      expect(deleted).toBeNull();
    });
  });
});
