import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    verify: jest.fn(),
    sendMail: jest.fn(),
  }),
}));

const mockNodemailer = require('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let mockTransporter: { verify: jest.Mock; sendMail: jest.Mock };

  function createService() {
    return new EmailService();
  }

  beforeEach(() => {
    mockTransporter = {
      verify: jest.fn().mockResolvedValue(true),
      sendMail: jest.fn().mockResolvedValue({ messageId: 'abc-123' }),
    };
    (mockNodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor - simulation mode', () => {
    it('should not create transporter when no credentials', () => {
      service = createService();
      expect(mockNodemailer.createTransport).not.toHaveBeenCalled();
    });
  });

  describe('constructor - SMTP mode', () => {
    it('should create transporter when credentials exist', () => {
      process.env.SMTP_USER = 'user@test.com';
      process.env.SMTP_PASS = 'secret';
      service = createService();
      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: 'user@test.com', pass: 'secret' },
        tls: { rejectUnauthorized: false },
      });
    });

    it('should use custom SMTP_HOST and SMTP_PORT if set', () => {
      process.env.SMTP_USER = 'user@test.com';
      process.env.SMTP_PASS = 'secret';
      process.env.SMTP_HOST = 'smtp.custom.com';
      process.env.SMTP_PORT = '465';
      service = createService();
      expect(mockNodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ host: 'smtp.custom.com', port: 465 }),
      );
    });

    it('should call verifyConnection on construction', () => {
      process.env.SMTP_USER = 'user@test.com';
      process.env.SMTP_PASS = 'secret';
      service = createService();
      expect(mockTransporter.verify).toHaveBeenCalledTimes(1);
    });
  });

  describe('verifyConnection', () => {
    it('should log success when verify passes', async () => {
      process.env.SMTP_USER = 'user@test.com';
      process.env.SMTP_PASS = 'secret';
      mockTransporter.verify.mockResolvedValue(true);
      service = createService();
      await new Promise(process.nextTick);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should log error when verify fails', async () => {
      process.env.SMTP_USER = 'user@test.com';
      process.env.SMTP_PASS = 'secret';
      mockTransporter.verify.mockRejectedValue(new Error('Connection refused'));
      service = createService();
      await new Promise(process.nextTick);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });
  });

  describe('sendEmail', () => {
    it('should log simulation when no transporter', async () => {
      service = createService();
      const logSpy = jest.spyOn(service['logger'], 'log');
      await service.sendEmail('to@test.com', 'Subject', '<html>');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[SIMULACION]'));
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('should send via transporter when configured', async () => {
      process.env.SMTP_USER = 'user@test.com';
      process.env.SMTP_PASS = 'secret';
      service = createService();
      await service.sendEmail('to@test.com', 'Subject', '<html>');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Piedrazul" <user@test.com>',
        to: 'to@test.com',
        subject: 'Subject',
        html: '<html>',
      });
    });

    it('should throw when sendMail fails', async () => {
      process.env.SMTP_USER = 'user@test.com';
      process.env.SMTP_PASS = 'secret';
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));
      service = createService();
      await expect(service.sendEmail('to@test.com', 'Subject', '<html>')).rejects.toThrow('SMTP error');
    });
  });
});
