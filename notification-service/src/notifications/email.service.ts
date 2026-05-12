import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    
    this.logger.log(`SMTP User: ${user ? 'Configurado' : 'No configurado'}`);
    this.logger.log(`SMTP Pass: ${pass ? 'Configurado' : 'No configurado'}`);
    
    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: user,
          pass: pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      
      this.verifyConnection();
      this.logger.log('Email service configured with SMTP');
    } else {
      this.logger.warn('Email service running in SIMULATION mode (no SMTP credentials)');
    }
  }

  private async verifyConnection() {
    if (!this.transporter) return;
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`SMTP connection failed: ${errorMessage}`);
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[SIMULACION] Email a ${to}: ${subject}`);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Piedrazul" <${process.env.SMTP_USER}>`,
        to: to,
        subject: subject,
        html: html,
      });
      this.logger.log(`Email sent to ${to} - MessageId: ${info.messageId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${to}: ${message}`);
      throw error;
    }
  }
}