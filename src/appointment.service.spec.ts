import { AppointmentService } from './appointment.service';
import { AppointmentDto } from './appointment.dto';

describe('AppointmentService', () => {
  let appointmentService: AppointmentService;

  beforeEach(() => {
    appointmentService = new AppointmentService();
  });

  describe('createAppointment', () => {
    it('debería crear una cita correctamente', () => {
      const appointmentDto: AppointmentDto = {
        date: new Date(Date.UTC(2026, 3, 10, 18, 31)), // Future date 2 hours ahead
        patientId: '12345', // example patientId
        doctorId: '54321', // example doctorId
        description: 'Consulta médica',
        status: 'scheduled', // missing required field added
      };

      const result = appointmentService.createAppointment(appointmentDto);
      expect(result).toBeTruthy();
    });
  });
});