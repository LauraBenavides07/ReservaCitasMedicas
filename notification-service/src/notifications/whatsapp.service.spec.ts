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
    // Sin credenciales en env, no debería llamar a axios
    process.env.WHATSAPP_PHONE_NUMBER_ID = '';
    process.env.WHATSAPP_ACCESS_TOKEN = '';

    await service.sendTextMessage('573001234567', 'Test');
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should call WhatsApp API when credentials are set', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone_id';
    process.env.WHATSAPP_ACCESS_TOKEN = 'test_token';
    // Re-instanciar para que tome las variables de entorno
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

  it('should throw when WhatsApp API returns an error', async () => {
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone_id';
    process.env.WHATSAPP_ACCESS_TOKEN = 'test_token';
    const freshService = new WhatsAppService();

    mockedAxios.post = jest
      .fn()
      .mockRejectedValueOnce(new Error('API error'));

    await expect(
      freshService.sendTextMessage('573001234567', 'Test'),
    ).rejects.toThrow('API error');
  });
});
