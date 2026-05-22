import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AppointmentService } from '../src/application/services/appointment.service';
import { AvailabilityService } from '../src/application/services/availability.service';
import { StatsService } from '../src/application/services/stats.service';
import { ExportService } from '../src/application/services/export.service';
import { NotificationService } from '../src/application/services/notification.service';
import { PatientService } from '../src/application/services/patient.service';
import { DoctorService } from '../src/application/services/doctor.service';
import { ConfigService } from '../src/application/services/config.service';
import { Appointment } from '../src/domain/entities/appointment.entity';
import { Patient } from '../src/domain/entities/patient.entity';
import { Doctor } from '../src/domain/entities/doctor.entity';
import { DoctorException } from '../src/domain/entities/doctor-exception.entity';
import { Config } from '../src/domain/entities/config.entity';
import { ICsvExporter } from '../src/application/abstractions/icsv-exporter.interface';
import { NOTIFICATION_SERVICE } from '../src/infrastructure/messaging/notifications-client.module';
import { IAppointmentRepository } from '../src/application/ports/appointment.repository';
import { IDoctorRepository } from '../src/application/ports/doctor.repository';
import { IDoctorExceptionRepository } from '../src/application/ports/doctor-exception.repository';
import { IPatientRepository } from '../src/application/ports/patient.repository';
import { TypeOrmAppointmentRepository } from '../src/infrastructure/persistence/typeorm-appointment.repository';
import { TypeOrmDoctorRepository } from '../src/infrastructure/persistence/typeorm-doctor.repository';
import { TypeOrmDoctorExceptionRepository } from '../src/infrastructure/persistence/typeorm-doctor-exception.repository';
import { TypeOrmPatientRepository } from '../src/infrastructure/persistence/typeorm-patient.repository';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

async function cleanDatabase(module: TestingModule) {
  const dataSource = module.get<DataSource>(getDataSourceToken());
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.query(
    'TRUNCATE TABLE appointments, doctor_exceptions, patients, doctors, configs, users CASCADE',
  );
  await queryRunner.release();
}

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function futureTime(): string {
  const d = new Date();
  d.setHours(d.getHours() + 4);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function oneHourAgo(): string {
  const d = new Date();
  d.setHours(d.getHours() - 1);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function nearFutureTime(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

describe('Appointment Integration', () => {
  let module: TestingModule;
  let appointmentService: AppointmentService;
  let availabilityService: AvailabilityService;
  let statsService: StatsService;
  let exportService: ExportService;
  let doctorRepo: Repository<Doctor>;
  let patientRepo: Repository<Patient>;
  let appointmentRepo: Repository<Appointment>;
  let configRepo: Repository<Config>;
  let doctorId: string;

  beforeAll(async () => {
    process.env.DB_DATABASE = 'piedrazul_test';

    const mockCsvExporter = {
      export: jest
        .fn()
        .mockImplementation(
          (data) =>
            '\uFEFF' + data.map((r) => Object.values(r).join(';')).join('\n'),
        ),
    };

    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: 'piedrazul_test',
          entities: [Appointment, Patient, Doctor, DoctorException, Config],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([
          Appointment,
          Patient,
          Doctor,
          DoctorException,
          Config,
        ]),
      ],
      providers: [
        AppointmentService,
        AvailabilityService,
        StatsService,
        ExportService,
        NotificationService,
        PatientService,
        ConfigService,
        { provide: NOTIFICATION_SERVICE, useValue: { emit: jest.fn() } },
        { provide: ICsvExporter, useValue: mockCsvExporter },
        {
          provide: IAppointmentRepository,
          useClass: TypeOrmAppointmentRepository,
        },
        { provide: IDoctorRepository, useClass: TypeOrmDoctorRepository },
        {
          provide: IDoctorExceptionRepository,
          useClass: TypeOrmDoctorExceptionRepository,
        },
        { provide: IPatientRepository, useClass: TypeOrmPatientRepository },
      ],
    }).compile();

    appointmentService = module.get(AppointmentService);
    availabilityService = module.get(AvailabilityService);
    statsService = module.get(StatsService);
    exportService = module.get(ExportService);
    doctorRepo = module.get(getRepositoryToken(Doctor));
    patientRepo = module.get(getRepositoryToken(Patient));
    appointmentRepo = module.get(getRepositoryToken(Appointment));
    configRepo = module.get(getRepositoryToken(Config));
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

    await configRepo.save({
      key: 'appointment_rules',
      value: { minAdvanceHours: 2, appointmentWindowDays: 15 },
    });
  });

  afterAll(async () => {
    await module.close();
  });

  describe('AvailabilityService.getAvailableSlots', () => {
    it('debería retornar slots disponibles para el doctor en una fecha laborable', async () => {
      const testDate = tomorrow();
      const slots = await availabilityService.getAvailableSlots(
        doctorId,
        testDate,
      );

      expect(Array.isArray(slots)).toBe(true);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toMatch(/^\d{2}:\d{2}$/);
    });

    it('debería excluir slots ocupados', async () => {
      const testDate = tomorrow();
      const patient = await patientRepo.save({
        document: '11111111',
        firstName: 'A',
        lastName: 'B',
        phone: '300',
        gender: 'M',
      });
      await appointmentRepo.save({
        appointmentDate: testDate,
        appointmentTime: '10:00',
        doctor: { id: doctorId },
        patient,
        status: 'agendada',
      });

      const slots = await availabilityService.getAvailableSlots(
        doctorId,
        testDate,
      );
      expect(slots.includes('10:00')).toBe(false);
    });
  });

  describe('AppointmentService.create', () => {
    it('debería crear una cita con paciente existente', async () => {
      const patient = await patientRepo.save({
        document: '12345678',
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '3001112233',
        gender: 'M',
      });

      const testDate = tomorrow();
      const testTime = futureTime();

      const result = await appointmentService.create({
        patientDocument: '12345678',
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '3001112233',
        gender: 'M',
        doctorId,
        date: testDate,
        time: testTime,
      });

      expect(result.id).toBeDefined();
      expect(result.status).toBe('agendada');
      expect(result.patient.id).toBe(patient.id);
    });

    it('debería crear paciente automáticamente si no existe', async () => {
      const testDate = tomorrow();
      const testTime = futureTime();

      const result = await appointmentService.create({
        patientDocument: '99999999',
        firstName: 'Nuevo',
        lastName: 'Paciente',
        phone: '3000000000',
        gender: 'O',
        doctorId,
        date: testDate,
        time: testTime,
      });

      expect(result.id).toBeDefined();

      const created = await patientRepo.findOneBy({ document: '99999999' });
      expect(created).toBeDefined();
      expect(created?.firstName).toBe('Nuevo');
    });

    it('debería lanzar ConflictException si el slot está ocupado', async () => {
      const testDate = tomorrow();
      const testTime = futureTime();

      const patient = await patientRepo.save({
        document: '11111111',
        firstName: 'A',
        lastName: 'B',
        phone: '300',
        gender: 'M',
      });
      await appointmentRepo.save({
        appointmentDate: testDate,
        appointmentTime: testTime,
        doctor: { id: doctorId },
        patient,
        status: 'agendada',
      });

      await expect(
        appointmentService.create({
          patientDocument: '22222222',
          firstName: 'C',
          lastName: 'D',
          phone: '301',
          gender: 'F',
          doctorId,
          date: testDate,
          time: testTime,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('AppointmentService.findAllByDoctorAndDate', () => {
    it('debería retornar citas filtradas por doctor y fecha', async () => {
      const testDate = tomorrow();
      const patient = await patientRepo.save({
        document: '11111111',
        firstName: 'A',
        lastName: 'B',
        phone: '300',
        gender: 'M',
      });
      await appointmentRepo.save({
        appointmentDate: testDate,
        appointmentTime: '10:00',
        doctor: { id: doctorId },
        patient,
        status: 'agendada',
      });

      const result = await appointmentService.findAllByDoctorAndDate(
        doctorId,
        testDate,
      );
      expect(result.appointments.length).toBe(1);
      expect(result.total).toBe(1);
    });

    it('debería retornar lista vacía si no hay citas', async () => {
      const result = await appointmentService.findAllByDoctorAndDate(
        doctorId,
        tomorrow(),
      );
      expect(result.appointments).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('AppointmentService.findAll', () => {
    it('debería retornar todas las citas', async () => {
      const patient = await patientRepo.save({
        document: '11111111',
        firstName: 'A',
        lastName: 'B',
        phone: '300',
        gender: 'M',
      });
      await appointmentRepo.save({
        appointmentDate: tomorrow(),
        appointmentTime: '10:00',
        doctor: { id: doctorId },
        patient,
        status: 'agendada',
      });

      const appointments = await appointmentService.findAll();
      expect(appointments.length).toBe(1);
    });
  });

  describe('StatsService.getDashboardStats', () => {
    it('debería retornar estadísticas globales', async () => {
      const stats = await statsService.getDashboardStats();
      expect(stats.stats).toBeDefined();
      expect(stats.doctorStats).toBeDefined();
    });
  });

  describe('AppointmentService.confirmAppointment', () => {
    it('debería confirmar una cita agendada', async () => {
      const patient = await patientRepo.save({
        document: '11111111',
        firstName: 'A',
        lastName: 'B',
        phone: '300',
        gender: 'M',
      });
      const appt = await appointmentRepo.save({
        appointmentDate: tomorrow(),
        appointmentTime: '10:00',
        doctor: { id: doctorId },
        patient,
        status: 'agendada',
      });

      const result = await appointmentService.confirmAppointment(appt.id);
      expect(result.status).toBe('confirmada');
    });

    it('debería lanzar NotFoundException si la cita no existe', async () => {
      await expect(
        appointmentService.confirmAppointment(
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('AppointmentService.findPatientByDocument', () => {
    it('debería encontrar un paciente por documento', async () => {
      await patientRepo.save({
        document: '12345678',
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '3001112233',
        gender: 'M',
      });

      const patient =
        await appointmentService.findPatientByDocument('12345678');
      expect(patient.firstName).toBe('Juan');
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      await expect(
        appointmentService.findPatientByDocument('99999999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('AppointmentService.create - reglas de validación', () => {
    it('debería lanzar BadRequestException si la hora es muy cercana (minAdvanceHours)', async () => {
      const patient = await patientRepo.save({
        document: '11111111',
        firstName: 'A',
        lastName: 'B',
        phone: '300',
        gender: 'M',
      });

      await expect(
        appointmentService.create({
          patientDocument: '11111111',
          firstName: 'A',
          lastName: 'B',
          phone: '300',
          gender: 'M',
          doctorId,
          date: today(),
          time: nearFutureTime(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException si la fecha excede el máximo de días', async () => {
      const patient = await patientRepo.save({
        document: '11111111',
        firstName: 'A',
        lastName: 'B',
        phone: '300',
        gender: 'M',
      });

      await expect(
        appointmentService.create({
          patientDocument: '11111111',
          firstName: 'A',
          lastName: 'B',
          phone: '300',
          gender: 'M',
          doctorId,
          date: daysFromNow(20),
          time: '10:00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException si el médico tiene excepción ese día', async () => {
      const excRepo = module.get(getRepositoryToken(DoctorException));
      await excRepo.save({ doctorId, date: tomorrow(), reason: 'Feriado' });

      const patient = await patientRepo.save({
        document: '11111111',
        firstName: 'A',
        lastName: 'B',
        phone: '300',
        gender: 'M',
      });

      await expect(
        appointmentService.create({
          patientDocument: '11111111',
          firstName: 'A',
          lastName: 'B',
          phone: '300',
          gender: 'M',
          doctorId,
          date: tomorrow(),
          time: futureTime(),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('AppointmentService.findAllByPatient', () => {
    it('debería retornar citas del paciente por ID', async () => {
      const patient = await patientRepo.save({
        document: '11111111',
        firstName: 'A',
        lastName: 'B',
        phone: '300',
        gender: 'M',
      });
      await appointmentRepo.save({
        appointmentDate: tomorrow(),
        appointmentTime: '10:00',
        doctor: { id: doctorId },
        patient,
        status: 'agendada',
      });

      const result = await appointmentService.findAllByPatient(patient.id);
      expect(result.length).toBe(1);
    });

    it('debería retornar citas del paciente por documento', async () => {
      const patient = await patientRepo.save({
        document: '11111111',
        firstName: 'A',
        lastName: 'B',
        phone: '300',
        gender: 'M',
      });
      await appointmentRepo.save({
        appointmentDate: tomorrow(),
        appointmentTime: '10:00',
        doctor: { id: doctorId },
        patient,
        status: 'agendada',
      });

      const result = await appointmentService.findAllByPatient(
        '00000000-0000-0000-0000-000000000000',
        '11111111',
      );
      expect(result.length).toBe(1);
    });
  });

  describe('AppointmentService.cancelAppointment', () => {
    let patient: Patient;
    let appt: Appointment;

    beforeEach(async () => {
      patient = await patientRepo.save({
        document: '11111111',
        firstName: 'A',
        lastName: 'B',
        phone: '300',
        gender: 'M',
      });
      appt = await appointmentRepo.save({
        appointmentDate: daysFromNow(5),
        appointmentTime: '10:00',
        doctor: { id: doctorId },
        patient,
        status: 'agendada',
      });
    });

    it('debería cancelar la cita del propio paciente', async () => {
      const result = await appointmentService.cancelAppointment(
        appt.id,
        patient.id,
      );
      expect(result.status).toBe('cancelada');
    });

    it('debería lanzar UnauthorizedException si otro paciente intenta cancelar', async () => {
      await expect(
        appointmentService.cancelAppointment(appt.id, 'other-patient-id'),
      ).rejects.toThrow('No tienes permiso');
    });

    it('debería lanzar NotFoundException si la cita no existe', async () => {
      await expect(
        appointmentService.cancelAppointment(
          '00000000-0000-0000-0000-000000000000',
          patient.id,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('AppointmentService.reschedule', () => {
    let patient: Patient;
    let appt: Appointment;

    beforeEach(async () => {
      patient = await patientRepo.save({
        document: '11111111',
        firstName: 'A',
        lastName: 'B',
        phone: '300',
        gender: 'M',
      });
      appt = await appointmentRepo.save({
        appointmentDate: daysFromNow(5),
        appointmentTime: '10:00',
        doctor: { id: doctorId },
        patient,
        status: 'agendada',
      });
    });

    it('debería reagendar a un nuevo horario', async () => {
      const newDate = daysFromNow(6);
      const newTime = '11:00';

      const result = await appointmentService.reschedule(
        appt.id,
        patient.id,
        newDate,
        newTime,
      );
      expect(result.appointmentDate).toBe(newDate);
      expect(result.appointmentTime).toBe(newTime);
      expect(result.status).toBe('agendada');
    });

    it('debería lanzar ConflictException si el nuevo horario está ocupado', async () => {
      const anotherPatient = await patientRepo.save({
        document: '22222222',
        firstName: 'C',
        lastName: 'D',
        phone: '301',
        gender: 'F',
      });
      await appointmentRepo.save({
        appointmentDate: daysFromNow(6),
        appointmentTime: '11:00',
        doctor: { id: doctorId },
        patient: anotherPatient,
        status: 'agendada',
      });

      await expect(
        appointmentService.reschedule(
          appt.id,
          patient.id,
          daysFromNow(6),
          '11:00',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debería lanzar UnauthorizedException si otro paciente intenta reagendar', async () => {
      await expect(
        appointmentService.reschedule(
          appt.id,
          'other-patient-id',
          daysFromNow(6),
          '11:00',
        ),
      ).rejects.toThrow('No tienes permiso');
    });

    it('debería lanzar BadRequestException si la nueva fecha es muy cercana', async () => {
      await expect(
        appointmentService.reschedule(
          appt.id,
          patient.id,
          today(),
          nearFutureTime(),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('ExportService.exportAppointmentsByDateAndDoctor', () => {
    it('debería exportar citas como CSV', async () => {
      const patient = await patientRepo.save({
        document: '11111111',
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '3001112233',
        gender: 'M',
      });
      const testDate = daysFromNow(5);
      await appointmentRepo.save({
        appointmentDate: testDate,
        appointmentTime: '10:00',
        doctor: { id: doctorId },
        patient,
        status: 'agendada',
      });

      const csv = await exportService.exportAppointmentsByDateAndDoctor(
        testDate,
        doctorId,
      );
      expect(csv).toContain('Juan');
      expect(csv).toContain('10:00');
    });

    it('debería lanzar NotFoundException si no hay citas para esa fecha', async () => {
      await expect(
        exportService.exportAppointmentsByDateAndDoctor(
          daysFromNow(10),
          doctorId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
