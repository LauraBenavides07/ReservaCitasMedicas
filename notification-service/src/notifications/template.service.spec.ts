import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';

describe('TemplateService', () => {
  let service: TemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateService],
    }).compile();
    service = module.get<TemplateService>(TemplateService);
  });

  const baseData = {
    patientName: 'María García',
    doctorName: 'Dr. Juan López',
    appointmentDate: '2026-05-15',
    appointmentTime: '10:00:00',
  };

  describe('buildCreatedMessage', () => {
    it('should include patient name', () => {
      const msg = service.buildCreatedMessage(baseData);
      expect(msg).toContain('María García');
    });

    it('should include doctor name', () => {
      const msg = service.buildCreatedMessage(baseData);
      expect(msg).toContain('Dr. Juan López');
    });

    it('should format date as DD/MM/YYYY', () => {
      const msg = service.buildCreatedMessage(baseData);
      expect(msg).toContain('15/05/2026');
    });

    it('should show time in HH:mm format', () => {
      const msg = service.buildCreatedMessage(baseData);
      expect(msg).toContain('10:00');
    });
  });

  describe('buildCancelledMessage', () => {
    it('should include cancellation indicator', () => {
      const msg = service.buildCancelledMessage(baseData);
      expect(msg).toContain('Cancelada');
    });

    it('should include optional reason when provided', () => {
      const msg = service.buildCancelledMessage({
        ...baseData,
        reason: 'Emergencia del médico',
      });
      expect(msg).toContain('Emergencia del médico');
    });

    it('should not include reason line when absent', () => {
      const msg = service.buildCancelledMessage(baseData);
      expect(msg).not.toContain('Motivo:');
    });
  });

  describe('buildReminderMessage', () => {
    it('should include reminder indicator', () => {
      const msg = service.buildReminderMessage(baseData);
      expect(msg).toContain('Recordatorio');
    });

    it('should include "mañana" wording', () => {
      const msg = service.buildReminderMessage(baseData);
      expect(msg).toContain('mañana');
    });
  });
});
