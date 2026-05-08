import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly apiVersion = 'v19.0';
  private readonly baseUrl: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? '';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
  }

  async sendTextMessage(to: string, body: string): Promise<void> {
    if (!this.phoneNumberId || !this.accessToken) {
      this.logger.warn(
        'WhatsApp credentials not configured. Skipping send. ' +
          `Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env`,
      );
      return;
    }

    const normalizedTo = to.replace(/[\s+\-]/g, '');

    try {
      await axios.post(
        this.baseUrl,
        {
          messaging_product: 'whatsapp',
          to: normalizedTo,
          type: 'text',
          text: { body },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`✅ WhatsApp message sent to ${normalizedTo}`);
    } catch (error: unknown) {
      let errMsg: string;
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        errMsg = axiosError.response?.data ? JSON.stringify(axiosError.response.data) : 'Unknown error';
      } else {
        errMsg = error instanceof Error ? error.message : 'Unknown error';
      }
      this.logger.error(`❌ WhatsApp send failed to ${normalizedTo}: ${errMsg}`);
      throw new Error(errMsg);
    }
  }
}