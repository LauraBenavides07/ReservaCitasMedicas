import { Test, TestingModule } from '@nestjs/testing';
import { RmqContext } from '@nestjs/microservices';
import { NotificationsController } from './notifications.controller';
import { WhatsAppService } from './whatsapp.service';
import { EmailService } from './email.service';
import { TemplateService } from './template.service';
import { NotificationLogService } from './notification-log.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let mockWhatsApp: jest.Mocked<WhatsAppService>;
  let mockEmail: jest.Mocked<EmailService>;
  let mockTemplate: jest.Mocked<TemplateService>;
  let mockLogService: jest.Mocked<NotificationLogService>;
  let mockChannel: { ack: jest.Mock; nack: jest.Mock };
  let mockContext: jest.Mocked<RmqContext>;

  const basePayload = {
    patientName: 'María García',
    patientPhone: '573001234567',
    patientEmail: 'maria@example.com',
    doctorName: 'Dr. Juan López',
    appointmentDate: '2026-05-15',
    appointmentTime: '10:00:00',
  };

  function createMockContext(): jest.Mocked<RmqContext> {
    mockChannel = { ack: jest.fn(), nack: jest.fn() };
    const ctx = { getChannelRef: jest.fn(), getMessage: jest.fn() } as any;
    ctx.getChannelRef.mockReturnValue(mockChannel);
    ctx.getMessage.mockReturnValue({ fields: {}, properties: {}, content: Buffer.from('') });
    return ctx;
  }

  beforeEach(async () => {
    mockWhatsApp = { sendTextMessage: jest.fn() } as any;
    mockEmail = { sendEmail: jest.fn() } as any;
    mockTemplate = {
      buildCreatedMessage: jest.fn().mockReturnValue('WhatsApp created msg'),
      buildCancelledMessage: jest.fn().mockReturnValue('WhatsApp cancelled msg'),
      buildReminderMessage: jest.fn().mockReturnValue('WhatsApp reminder msg'),
      buildRescheduleMessage: jest.fn().mockReturnValue('WhatsApp reschedule msg'),
      buildCreatedEmail: jest.fn().mockReturnValue('<html>created</html>'),
      buildCancelledEmail: jest.fn().mockReturnValue('<html>cancelled</html>'),
      buildReminderEmail: jest.fn().mockReturnValue('<html>reminder</html>'),
      buildRescheduledEmail: jest.fn().mockReturnValue('<html>rescheduled</html>'),
    } as any;
    mockLogService = { guardarLog: jest.fn().mockResolvedValue({}) } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: WhatsAppService, useValue: mockWhatsApp },
        { provide: EmailService, useValue: mockEmail },
        { provide: TemplateService, useValue: mockTemplate },
        { provide: NotificationLogService, useValue: mockLogService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    mockContext = createMockContext();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.TEST_EMAIL;
  });

  describe('getRecipientEmail (private)', () => {
    it('should return TEST_EMAIL when set', () => {
      process.env.TEST_EMAIL = 'test@example.com';
      const ctrl = new NotificationsController(mockWhatsApp, mockEmail, mockTemplate, mockLogService);
      const result = (ctrl as any).getRecipientEmail('Paciente', 'original@test.com');
      expect(result).toBe('test@example.com');
    });

    it('should return provided email when no TEST_EMAIL', () => {
      const result = (controller as any).getRecipientEmail('Paciente', 'original@test.com');
      expect(result).toBe('original@test.com');
    });

    it('should generate email from name when no TEST_EMAIL and no provided email', () => {
      const result = (controller as any).getRecipientEmail('María García');
      expect(result).toBe('María.García@example.com');
    });

    it('should use defaults for missing name when generating email', () => {
      const result = (controller as any).getRecipientEmail('Paciente');
      expect(result).toBe('Paciente@example.com');
    });
  });

  describe('handleAppointmentCreated', () => {
    it('should send email, whatsapp, and log on success', async () => {
      await controller.handleAppointmentCreated(basePayload, mockContext);

      expect(mockTemplate.buildCreatedEmail).toHaveBeenCalledWith({
        patientName: 'María García',
        doctorName: 'Dr. Juan López',
        appointmentDate: '2026-05-15',
        appointmentTime: '10:00',
      });
      expect(mockEmail.sendEmail).toHaveBeenCalledWith('maria@example.com', expect.any(String), '<html>created</html>');
      expect(mockTemplate.buildCreatedMessage).toHaveBeenCalled();
      expect(mockWhatsApp.sendTextMessage).toHaveBeenCalledWith('573001234567', 'WhatsApp created msg');
      expect(mockLogService.guardarLog).toHaveBeenCalledWith({
        evento: 'CITA_CREADA',
        destinatario: 'maria@example.com',
        estado: 'ENVIADO',
        mensaje: expect.stringContaining('María García'),
      });
      expect(mockChannel.ack).toHaveBeenCalled();
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('should skip WhatsApp when no phone', async () => {
      await controller.handleAppointmentCreated({ ...basePayload, patientPhone: '' }, mockContext);

      expect(mockWhatsApp.sendTextMessage).not.toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should use defaults when data is minimal', async () => {
      await controller.handleAppointmentCreated({}, mockContext);

      expect(mockEmail.sendEmail).toHaveBeenCalled();
      expect(mockWhatsApp.sendTextMessage).not.toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should nack on error', async () => {
      mockEmail.sendEmail.mockRejectedValueOnce(new Error('Email failed'));

      await controller.handleAppointmentCreated(basePayload, mockContext);

      expect(mockChannel.nack).toHaveBeenCalledWith(expect.anything(), false, false);
      expect(mockChannel.ack).not.toHaveBeenCalled();
    });
  });

  describe('handleAppointmentCancelled', () => {
    it('should send cancellation notifications on success', async () => {
      await controller.handleAppointmentCancelled(basePayload, mockContext);

      expect(mockTemplate.buildCancelledEmail).toHaveBeenCalled();
      expect(mockEmail.sendEmail).toHaveBeenCalledWith('maria@example.com', expect.stringContaining('Cancelada'), '<html>cancelled</html>');
      expect(mockTemplate.buildCancelledMessage).toHaveBeenCalled();
      expect(mockWhatsApp.sendTextMessage).toHaveBeenCalledWith('573001234567', 'WhatsApp cancelled msg');
      expect(mockLogService.guardarLog).toHaveBeenCalledWith({
        evento: 'CITA_CANCELADA',
        destinatario: 'maria@example.com',
        estado: 'ENVIADO',
        mensaje: expect.stringContaining('cancelada'),
      });
      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should skip WhatsApp when no phone', async () => {
      await controller.handleAppointmentCancelled({ ...basePayload, patientPhone: '' }, mockContext);
      expect(mockWhatsApp.sendTextMessage).not.toHaveBeenCalled();
    });

    it('should nack on error', async () => {
      mockLogService.guardarLog.mockRejectedValueOnce(new Error('DB error'));
      await controller.handleAppointmentCancelled(basePayload, mockContext);
      expect(mockChannel.nack).toHaveBeenCalled();
    });
  });

  describe('handleAppointmentReminder', () => {
    it('should send reminder notifications on success', async () => {
      await controller.handleAppointmentReminder(basePayload, mockContext);

      expect(mockTemplate.buildReminderEmail).toHaveBeenCalled();
      expect(mockEmail.sendEmail).toHaveBeenCalledWith('maria@example.com', expect.stringContaining('Recordatorio'), '<html>reminder</html>');
      expect(mockTemplate.buildReminderMessage).toHaveBeenCalled();
      expect(mockWhatsApp.sendTextMessage).toHaveBeenCalledWith('573001234567', 'WhatsApp reminder msg');
      expect(mockLogService.guardarLog).toHaveBeenCalledWith({
        evento: 'RECORDATORIO_CITA',
        destinatario: 'maria@example.com',
        estado: 'ENVIADO',
        mensaje: expect.stringContaining('Recordatorio'),
      });
      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should skip WhatsApp when no phone', async () => {
      await controller.handleAppointmentReminder({ ...basePayload, patientPhone: '' }, mockContext);
      expect(mockWhatsApp.sendTextMessage).not.toHaveBeenCalled();
    });

    it('should nack on error', async () => {
      mockEmail.sendEmail.mockRejectedValueOnce(new Error('SMTP down'));
      await controller.handleAppointmentReminder(basePayload, mockContext);
      expect(mockChannel.nack).toHaveBeenCalled();
    });
  });

  describe('handleAppointmentRescheduled', () => {
    it('should send reschedule notifications on success', async () => {
      await controller.handleAppointmentRescheduled(basePayload, mockContext);

      expect(mockTemplate.buildRescheduledEmail).toHaveBeenCalled();
      expect(mockEmail.sendEmail).toHaveBeenCalledWith('maria@example.com', expect.stringContaining('Reprogramada'), '<html>rescheduled</html>');
      expect(mockTemplate.buildRescheduleMessage).toHaveBeenCalled();
      expect(mockWhatsApp.sendTextMessage).toHaveBeenCalledWith('573001234567', 'WhatsApp reschedule msg');
      expect(mockLogService.guardarLog).toHaveBeenCalledWith({
        evento: 'CITA_REASIGNADA',
        destinatario: 'maria@example.com',
        estado: 'ENVIADO',
        mensaje: expect.stringContaining('reprogramada'),
      });
      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should skip WhatsApp when no phone', async () => {
      await controller.handleAppointmentRescheduled({ ...basePayload, patientPhone: '' }, mockContext);
      expect(mockWhatsApp.sendTextMessage).not.toHaveBeenCalled();
    });

    it('should nack on error', async () => {
      mockWhatsApp.sendTextMessage.mockRejectedValueOnce(new Error('API error'));
      await controller.handleAppointmentRescheduled(basePayload, mockContext);
      expect(mockChannel.nack).toHaveBeenCalled();
    });
  });

  describe('procesarNotificacion (legacy)', () => {
    const legacyBase = {
      paciente: 'María García',
      telefono: '573001234567',
      correo: 'maria@example.com',
      medico: 'Dr. Juan López',
      fecha: '2026-05-15',
      hora: '10:00',
    };

    it('should handle CITA_CREADA event', async () => {
      await controller.procesarNotificacion({ ...legacyBase, evento: 'CITA_CREADA' }, mockContext);

      expect(mockEmail.sendEmail).toHaveBeenCalled();
      expect(mockTemplate.buildCreatedMessage).toHaveBeenCalled();
      expect(mockWhatsApp.sendTextMessage).toHaveBeenCalled();
      expect(mockLogService.guardarLog).toHaveBeenCalledWith({
        evento: 'CITA_CREADA',
        destinatario: 'maria@example.com',
        estado: 'ENVIADO',
        mensaje: expect.stringContaining('CITA_CREADA'),
      });
      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should handle CITA_CANCELADA event', async () => {
      await controller.procesarNotificacion({ ...legacyBase, evento: 'CITA_CANCELADA' }, mockContext);

      expect(mockEmail.sendEmail).toHaveBeenCalled();
      expect(mockTemplate.buildCancelledMessage).toHaveBeenCalled();
      expect(mockWhatsApp.sendTextMessage).toHaveBeenCalled();
      expect(mockLogService.guardarLog).toHaveBeenCalledWith({
        evento: 'CITA_CANCELADA',
        destinatario: 'maria@example.com',
        estado: 'ENVIADO',
        mensaje: expect.stringContaining('CITA_CANCELADA'),
      });
      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should skip unknown events and ack', async () => {
      await controller.procesarNotificacion({ ...legacyBase, evento: 'OTRO_EVENTO' }, mockContext);

      expect(mockEmail.sendEmail).not.toHaveBeenCalled();
      expect(mockWhatsApp.sendTextMessage).not.toHaveBeenCalled();
      expect(mockLogService.guardarLog).not.toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalled();
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('should use defaults for missing legacy fields', async () => {
      await controller.procesarNotificacion({ evento: 'CITA_CREADA' }, mockContext);

      expect(mockEmail.sendEmail).toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should nack on error', async () => {
      mockEmail.sendEmail.mockRejectedValueOnce(new Error('Failed'));
      await controller.procesarNotificacion({ ...legacyBase, evento: 'CITA_CREADA' }, mockContext);
      expect(mockChannel.nack).toHaveBeenCalled();
    });
  });
});
