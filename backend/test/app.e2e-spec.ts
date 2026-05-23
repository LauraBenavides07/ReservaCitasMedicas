jest.mock('jwks-rsa', () => ({
  passportJwtSecret: jest.fn(),
}));

jest.mock('passport-jwt', () => ({
  Strategy: class {
    name = 'jwt';
    constructor() {}
    authenticate() {}
    success() {}
    fail() {}
    redirect() {}
    pass() {}
    error() {}
  },
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: jest.fn(),
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/infrastructure/auth/jwt-auth.guard';
import { NOTIFICATION_SERVICE } from '../src/infrastructure/messaging/notifications-client.module';
import {
  seedTestData,
  cleanDatabase,
  tomorrow,
  futureTime,
  TestSeed,
  daysFromNow,
} from './helpers';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Doctor } from '../src/domain/entities/doctor.entity';
import { Patient } from '../src/domain/entities/patient.entity';
import { Appointment } from '../src/domain/entities/appointment.entity';
import { DoctorException } from '../src/domain/entities/doctor-exception.entity';

interface DoctorResponse {
  id: string;
  name: string;
  specialty: string;
}

interface AppointmentResponse {
  id: string;
  status: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

interface DoctorExceptionResponse {
  id: string;
  reason: string;
}

interface ConfigResponse {
  minAdvanceHours: number;
  appointmentWindowDays: number;
}

interface StatsResponse {
  stats: any;
  doctorStats: any;
}


const AUTH_PATIENT_ID = '11111111-1111-4111-8111-111111111111';

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest() as any;
    const user = {
      id: AUTH_PATIENT_ID,
      document: '12345',
      roles: ['patient'],
    };
    (req as { user?: typeof user }).user = user;
    return true;
  }
}

describe('Piedrazul API (e2e)', () => {
  let app: INestApplication<App>;
  let seed: TestSeed;
  let doctorRepo: Repository<Doctor>;
  let patientRepo: Repository<Patient>;
  let appointmentRepo: Repository<Appointment>;

  beforeAll(async () => {
    process.env.DB_DATABASE = 'piedrazul_test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockAuthGuard)
      .overrideProvider(NOTIFICATION_SERVICE)
      .useValue({ emit: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    doctorRepo = app.get(getRepositoryToken(Doctor));
    patientRepo = app.get(getRepositoryToken(Patient));
    appointmentRepo = app.get(getRepositoryToken(Appointment));
  });

  beforeEach(async () => {
    await cleanDatabase(app);
    seed = await seedTestData(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Doctores CRUD', () => {
    it('GET /doctors debería listar doctores', async () => {
      const res = await request(app.getHttpServer())
        .get('/doctors')
        .expect(200);

      const body = res.body as DoctorResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
      expect(body[0].name).toBe('Dr. Test');
    });

    it('GET /doctors/:id debería retornar un doctor', async () => {
      const res = await request(app.getHttpServer())
        .get(`/doctors/${seed.doctor.id}`)
        .expect(200);

      const body = res.body as DoctorResponse;
      expect(body.name).toBe('Dr. Test');
      expect(body.specialty).toBe('Cardiología');
    });

    it('GET /doctors/:id debería retornar 404 si no existe', () => {
      return request(app.getHttpServer())
        .get('/doctors/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('POST /doctors debería crear un doctor', async () => {
      const res = await request(app.getHttpServer())
        .post('/doctors')
        .send({
          name: 'Dra. López',
          specialty: 'Pediatría',
          scheduleStart: '09:00',
          scheduleEnd: '16:00',
          slotDuration: 20,
          lunchStart: '13:00',
          lunchEnd: '14:00',
          activeDays: [1,2,3,4,5],
        })
        .expect(201);

      const body = res.body as DoctorResponse;
      expect(body.name).toBe('Dra. López');
      expect(body.id).toBeDefined();
    });

    it('PATCH /doctors/:id debería actualizar un doctor', async () => {
      await request(app.getHttpServer())
        .patch(`/doctors/${seed.doctor.id}`)
        .send({ specialty: 'Cirugía General' })
        .expect(200);

      const updated = await doctorRepo.findOneBy({ id: seed.doctor.id });
      expect(updated?.specialty).toBe('Cirugía General');
    });

    it('DELETE /doctors/:id debería eliminar un doctor sin citas', async () => {
      await request(app.getHttpServer())
        .delete(`/doctors/${seed.doctor.id}`)
        .expect(200);

      const deleted = await doctorRepo.findOneBy({ id: seed.doctor.id });
      expect(deleted).toBeNull();
    });

    it('DELETE /doctors/:id debería fallar si tiene citas', async () => {
      const patient = await patientRepo.save({
        document: '99999999',
        firstName: 'P',
        lastName: 'T',
        phone: '300',
        gender: 'M',
      });
      await appointmentRepo.save({
        appointmentDate: tomorrow(),
        appointmentTime: '10:00',
        doctor: seed.doctor,
        patient,
        status: 'agendada',
      });

      await request(app.getHttpServer())
        .delete(`/doctors/${seed.doctor.id}`)
        .expect(400);
    });

    describe('Excepciones de doctor', () => {
      it('POST /doctors/:id/exceptions debería agregar excepción', async () => {
        await request(app.getHttpServer())
          .post(`/doctors/${seed.doctor.id}/exceptions`)
          .send({ date: '2026-12-25', reason: 'Navidad' })
          .expect(201);
      });

      it('GET /doctors/:id/exceptions debería listar excepciones', async () => {
        const excRepo = app.get<Repository<DoctorException>>(
          getRepositoryToken(DoctorException),
        );
        await excRepo.save({
          doctorId: seed.doctor.id,
          date: '2026-12-25',
          reason: 'Navidad',
        });

        const res = await request(app.getHttpServer())
          .get(`/doctors/${seed.doctor.id}/exceptions`)
          .expect(200);

        const body = res.body as DoctorExceptionResponse[];
        expect(body.length).toBe(1);
        expect(body[0].reason).toBe('Navidad');
      });

      it('DELETE /doctors/:id/exceptions/:excId debería eliminar excepción', async () => {
        const excRepo = app.get<Repository<DoctorException>>(
          getRepositoryToken(DoctorException),
        );
        const exc = await excRepo.save({
          doctorId: seed.doctor.id,
          date: '2026-12-25',
          reason: 'Navidad',
        });

        await request(app.getHttpServer())
          .delete(`/doctors/${seed.doctor.id}/exceptions/${exc.id}`)
          .expect(200);
      });
    });
  });

  describe('Citas', () => {
    it('GET /available-slots debería retornar horarios disponibles', async () => {
      const testDate = tomorrow();
      const res = await request(app.getHttpServer())
        .get(
          `/appointments/available-slots?doctorId=${seed.doctor.id}&date=${testDate}`,
        )
        .expect(200);

      const slots = res.body as string[];
      expect(Array.isArray(slots)).toBe(true);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toMatch(/^\d{2}:\d{2}$/);
    });

    it('POST /appointments debería crear una cita', async () => {
      const testDate = tomorrow();
      const testTime = futureTime();

      const res = await request(app.getHttpServer())
        .post('/appointments')
        .send({
          patientDocument: '12345678',
          firstName: 'Juan',
          lastName: 'Pérez',
          phone: '3001112233',
          gender: 'M',
          doctorId: seed.doctor.id,
          date: testDate,
          time: testTime,
        })
        .expect(201);

      const body = res.body as AppointmentResponse;
      expect(body.id).toBeDefined();
      expect(body.status).toBe('agendada');
    });

    it('POST /appointments debería fallar si el slot está ocupado', async () => {
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
        doctor: seed.doctor,
        patient,
        status: 'agendada',
      });

      await request(app.getHttpServer())
        .post('/appointments')
        .send({
          patientDocument: '22222222',
          firstName: 'C',
          lastName: 'D',
          phone: '301',
          gender: 'F',
          doctorId: seed.doctor.id,
          date: testDate,
          time: testTime,
        })
        .expect(409);
    });

    it('GET /appointments debería listar citas por doctor', async () => {
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
        doctor: seed.doctor,
        patient,
        status: 'agendada',
      });

      const res = await request(app.getHttpServer())
        .get(`/appointments?doctorId=${seed.doctor.id}&date=${testDate}`)
        .expect(200);

      const body = res.body as { appointments: AppointmentResponse[]; total: number };
      expect(body.appointments).toBeDefined();
      expect(body.total).toBeGreaterThanOrEqual(1);
    });

    it('POST /appointments debería crear paciente si no existe', async () => {
      const testDate = tomorrow();
      const testTime = futureTime();

      await request(app.getHttpServer())
        .post('/appointments')
        .send({
          patientDocument: '99999999',
          firstName: 'Nuevo',
          lastName: 'Paciente',
          phone: '3000000000',
          gender: 'O',
          doctorId: seed.doctor.id,
          date: testDate,
          time: testTime,
        })
        .expect(201);

      const created = await patientRepo.findOneBy({ document: '99999999' });
      expect(created).toBeDefined();
      expect(created?.firstName).toBe('Nuevo');
    });

    it('GET /appointments/all debería listar todas las citas', async () => {
      const res = await request(app.getHttpServer())
        .get('/appointments/all')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /appointments/stats debería retornar estadísticas', async () => {
      const res = await request(app.getHttpServer())
        .get('/appointments/stats')
        .expect(200);

      const body = res.body as StatsResponse;
      expect(body.stats).toBeDefined();
      expect(body.doctorStats).toBeDefined();
    });

    it('PATCH /appointments/:id/confirm debería confirmar una cita', async () => {
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
        doctor: seed.doctor,
        patient,
        status: 'agendada',
      });

      const res = await request(app.getHttpServer())
        .patch(`/appointments/${appt.id}/confirm`)
        .expect(200);

      const body = res.body as AppointmentResponse;
      expect(body.status).toBe('confirmada');
    });
  });

  describe('Configuración', () => {
    it('GET /configs debería retornar la configuración', async () => {
      const res = await request(app.getHttpServer())
        .get('/configs')
        .expect(200);

      const body = res.body as ConfigResponse;
      expect(body.minAdvanceHours).toBe(2);
      expect(body.appointmentWindowDays).toBe(15);
    });

    it('PATCH /configs debería actualizar la configuración', async () => {
      const res = await request(app.getHttpServer())
        .patch('/configs')
        .send({ minAdvanceHours: 4, appointmentWindowDays: 30 })
        .expect(200);

      const body = res.body as ConfigResponse;
      expect(body.minAdvanceHours).toBe(4);
      expect(body.appointmentWindowDays).toBe(30);
    });
  });

  describe('Citas - autenticadas (MockAuthGuard)', () => {
    beforeEach(async () => {
      await patientRepo.save({
        id: AUTH_PATIENT_ID,
        document: '12345',
        firstName: 'Autenticado',
        lastName: 'Paciente',
        phone: '300',
        gender: 'M',
      });
    });

    it('GET /appointments/my-appointments debería retornar citas del paciente', async () => {
      const appt = await appointmentRepo.save({
        appointmentDate: daysFromNow(5),
        appointmentTime: '10:00',
        doctor: seed.doctor,
        patient: { id: AUTH_PATIENT_ID } as Patient,
        status: 'agendada',
      });

      const res = await request(app.getHttpServer())
        .get('/appointments/my-appointments')
        .expect(200);

      const body = res.body as AppointmentResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(1);
      expect(body[0].id).toBe(appt.id);
    });

    it('PATCH /appointments/:id/cancel debería cancelar la cita del paciente', async () => {
      const appt = await appointmentRepo.save({
        appointmentDate: daysFromNow(5),
        appointmentTime: '10:00',
        doctor: seed.doctor,
        patient: { id: AUTH_PATIENT_ID } as Patient,
        status: 'agendada',
      });

      const res = await request(app.getHttpServer())
        .patch(`/appointments/${appt.id}/cancel`)
        .expect(200);

      const body = res.body as AppointmentResponse;
      expect(body.status).toBe('cancelada');
    });

    it('PATCH /appointments/:id/reschedule debería reagendar la cita', async () => {
      const appt = await appointmentRepo.save({
        appointmentDate: daysFromNow(5),
        appointmentTime: '10:00',
        doctor: seed.doctor,
        patient: { id: AUTH_PATIENT_ID } as Patient,
        status: 'agendada',
      });

      const newDate = daysFromNow(6);
      const res = await request(app.getHttpServer())
        .patch(`/appointments/${appt.id}/reschedule`)
        .send({ date: newDate, time: '11:00' })
        .expect(200);

      const body = res.body as AppointmentResponse;
      expect(body.appointmentDate).toBe(newDate);
      expect(body.appointmentTime).toBe('11:00');
    });
  });

  describe('Citas - reglas de validación', () => {
    it('POST /appointments debería fallar si el médico tiene excepción ese día', async () => {
      const excRepo = app.get<Repository<DoctorException>>(
        getRepositoryToken(DoctorException),
      );
      await excRepo.save({
        doctorId: seed.doctor.id,
        date: tomorrow(),
        reason: 'Feriado',
      });

      await request(app.getHttpServer())
        .post('/appointments')
        .send({
          patientDocument: '11111111',
          firstName: 'A',
          lastName: 'B',
          phone: '300',
          gender: 'M',
          doctorId: seed.doctor.id,
          date: tomorrow(),
          time: futureTime(),
        })
        .expect(400);
    });
  });

  describe('Exportar citas CSV', () => {
    it('GET /appointments/export debería retornar CSV', async () => {
      const patient = await patientRepo.save({
        document: '11111111',
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '300',
        gender: 'M',
      });
      const testDate = daysFromNow(5);
      await appointmentRepo.save({
        appointmentDate: testDate,
        appointmentTime: '10:00',
        doctor: seed.doctor,
        patient,
        status: 'agendada',
      });

      const res = await request(app.getHttpServer())
        .get(`/appointments/export?date=${testDate}&doctorId=${seed.doctor.id}`)
        .expect(200);

      expect(res.text).toContain('Hora');
      expect(res.text).toContain('Juan Pérez');
      expect(res.text).toContain('10:00');
    });
  });
});
