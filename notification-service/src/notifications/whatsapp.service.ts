import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

/**
 * Adaptador (puerto de salida) para la WhatsApp Cloud API de Meta.
 * Todos los envíos pasan por este servicio para facilitar el testing y la sustitución del proveedor.
 */
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

  /**
   * Envía un mensaje de texto libre al número indicado.
   * En producción, Meta requiere usar plantillas aprobadas para mensajes
   * iniciados por el negocio. Para pruebas, el sandbox permite texto libre.
   *
   * @param to   Número en formato internacional sin '+' (ej. 573001234567)
   * @param body Texto del mensaje
   */
  async sendTextMessage(to: string, body: string): Promise<void> {
    if (!this.phoneNumberId || !this.accessToken) {
      this.logger.warn(
        'WhatsApp credentials not configured. Skipping send. ' +
          `Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env`,
      );
      return;
    }

    // Normalizar número: quitar '+' y espacios
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
    } catch (error) {
      const errMsg = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      this.logger.error(`❌ WhatsApp send failed to ${normalizedTo}: ${errMsg}`);
      throw new Error(errMsg);
    }
  }
}
