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

    it('should include formatted date', () => {
      const msg = service.buildCreatedMessage(baseData);
      expect(msg).toContain('15 de Mayo de 2026');
    });

    it('should show time in HH:mm format', () => {
      const msg = service.buildCreatedMessage(baseData);
      expect(msg).toContain('10:00');
    });

    it('should include confirmation header', () => {
      const msg = service.buildCreatedMessage(baseData);
      expect(msg).toContain('Cita Confirmada');
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

  describe('buildRescheduleMessage', () => {
    it('should include reschedule indicator', () => {
      const msg = service.buildRescheduleMessage(baseData);
      expect(msg).toContain('Reprogramada');
    });

    it('should include patient name', () => {
      const msg = service.buildRescheduleMessage(baseData);
      expect(msg).toContain('María García');
    });

    it('should include doctor name', () => {
      const msg = service.buildRescheduleMessage(baseData);
      expect(msg).toContain('Dr. Juan López');
    });

    it('should include formatted date and time', () => {
      const msg = service.buildRescheduleMessage(baseData);
      expect(msg).toContain('15 de Mayo de 2026');
      expect(msg).toContain('10:00');
    });
  });

  describe('buildEmailHtml', () => {
    it('should return HTML with title and content', () => {
      const html = service.buildEmailHtml('Test Title', '<p>Test content</p>');
      expect(html).toContain('Test Title');
      expect(html).toContain('Test content');
    });

    it('should include Piedrazul branding', () => {
      const html = service.buildEmailHtml('Title', '<p>Content</p>');
      expect(html).toContain('Piedrazul');
      expect(html).toContain('Cuidado con Calidez');
    });

    it('should include help section', () => {
      const html = service.buildEmailHtml('Title', '<p>Content</p>');
      expect(html).toContain('¿Necesita ayuda?');
    });

    it('should include footer', () => {
      const html = service.buildEmailHtml('Title', '<p>Content</p>');
      expect(html).toContain('Sistema de Gestión de Citas Médicas');
    });
  });

  describe('buildCreatedEmail', () => {
    it('should return HTML with confirmation info', () => {
      const html = service.buildCreatedEmail(baseData);
      expect(html).toContain('Confirmación de Cita');
      expect(html).toContain('María García');
      expect(html).toContain('Dr. Juan López');
      expect(html).toContain('15 de Mayo de 2026');
      expect(html).toContain('10:00');
    });

    it('should include doctor emoji', () => {
      const html = service.buildCreatedEmail(baseData);
      expect(html).toContain('👨‍⚕️');
    });
  });

  describe('buildCancelledEmail', () => {
    it('should return HTML with cancellation info', () => {
      const html = service.buildCancelledEmail(baseData);
      expect(html).toContain('Cancelación de Cita');
      expect(html).toContain('María García');
      expect(html).toContain('Dr. Juan López');
      expect(html).toContain('15 de Mayo de 2026');
    });
  });

  describe('buildReminderEmail', () => {
    it('should return HTML with reminder info', () => {
      const html = service.buildReminderEmail(baseData);
      expect(html).toContain('Recordatorio de Cita');
      expect(html).toContain('María García');
      expect(html).toContain('Dr. Juan López');
      expect(html).toContain('15 de Mayo de 2026');
      expect(html).toContain('10:00');
    });

    it('should mention "mañana" in content', () => {
      const html = service.buildReminderEmail(baseData);
      expect(html).toContain('mañana');
    });
  });

  describe('buildRescheduledEmail', () => {
    it('should return HTML with reschedule info', () => {
      const html = service.buildRescheduledEmail(baseData);
      expect(html).toContain('Reprogramación de Cita');
      expect(html).toContain('María García');
      expect(html).toContain('Dr. Juan López');
      expect(html).toContain('15 de Mayo de 2026');
      expect(html).toContain('10:00');
    });

    it('should indicate new date and time', () => {
      const html = service.buildRescheduledEmail(baseData);
      expect(html).toContain('Nueva Fecha');
      expect(html).toContain('Nueva Hora');
    });
  });

  describe('formatDate (private)', () => {
    it('should format valid ISO date to Spanish format', () => {
      const result = (service as any).formatDate('2026-05-15');
      expect(result).toBe('15 de Mayo de 2026');
    });

    it('should return original string if no hyphen', () => {
      const result = (service as any).formatDate('invalid');
      expect(result).toBe('invalid');
    });

    it('should return original string if empty', () => {
      const result = (service as any).formatDate('');
      expect(result).toBe('');
    });

    it('should handle all months correctly', () => {
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      months.forEach((monthName, i) => {
        const month = (i + 1).toString().padStart(2, '0');
        const result = (service as any).formatDate(`2026-${month}-01`);
        expect(result).toBe(`1 de ${monthName} de 2026`);
      });
    });

    it('should handle single-digit day', () => {
      const result = (service as any).formatDate('2026-03-05');
      expect(result).toBe('5 de Marzo de 2026');
    });
  });
});
