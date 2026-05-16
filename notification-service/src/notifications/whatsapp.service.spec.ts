import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppService } from './whatsapp.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WhatsAppService', () => {
  let service: WhatsAppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WhatsAppService],
    }).compile();
    service = module.get<WhatsAppService>(WhatsAppService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should skip sending if credentials are not configured', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_ID = '';
    process.env.WHATSAPP_ACCESS_TOKEN = '';

    await service.sendTextMessage('573001234567', 'Test');
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should call WhatsApp API when credentials are set', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone_id';
    process.env.WHATSAPP_ACCESS_TOKEN = 'test_token';
    const freshService = new WhatsAppService();

    mockedAxios.post = jest.fn().mockResolvedValueOnce({ data: { messages: [{ id: 'wamid.123' }] } });

    await freshService.sendTextMessage('573001234567', 'Hola test');
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    const callArgs = (mockedAxios.post as jest.Mock).mock.calls[0];
    expect(callArgs[1]).toMatchObject({
      messaging_product: 'whatsapp',
      to: '573001234567',
      type: 'text',
    });
  });

  it('should log error when WhatsApp API fails without throwing', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone_id';
    process.env.WHATSAPP_ACCESS_TOKEN = 'test_token';
    const freshService = new WhatsAppService();

    mockedAxios.post = jest.fn().mockRejectedValueOnce(new Error('API error'));

    await expect(freshService.sendTextMessage('573001234567', 'Test')).resolves.toBeUndefined();
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should handle axios error with response data', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone_id';
    process.env.WHATSAPP_ACCESS_TOKEN = 'test_token';
    const freshService = new WhatsAppService();

    const axiosError = new Error('Request failed');
    (axiosError as any).response = { data: { error: { message: 'Invalid token' } } };
    mockedAxios.post = jest.fn().mockRejectedValueOnce(axiosError);

    await expect(freshService.sendTextMessage('573001234567', 'Test')).resolves.toBeUndefined();
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('should normalize phone numbers by removing spaces and hyphens', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone_id';
    process.env.WHATSAPP_ACCESS_TOKEN = 'test_token';
    const freshService = new WhatsAppService();

    mockedAxios.post = jest.fn().mockResolvedValueOnce({ data: {} });

    await freshService.sendTextMessage('573 001 234-567', 'Test');
    const callArgs = (mockedAxios.post as jest.Mock).mock.calls[0];
    expect(callArgs[1].to).toBe('573001234567');
  });

  it('should log simulation message with truncated body', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_ID = '';
    process.env.WHATSAPP_ACCESS_TOKEN = '';
    const freshService = new WhatsAppService();
    const logSpy = jest.spyOn(freshService['logger'], 'log');

    await freshService.sendTextMessage('573001234567', 'A'.repeat(100));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[SIMULACION WHATSAPP]'));
  });
});
