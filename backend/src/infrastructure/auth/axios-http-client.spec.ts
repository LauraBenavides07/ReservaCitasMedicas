import { AxiosHttpClient } from './axios-http-client';

jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

describe('AxiosHttpClient', () => {
  let client: AxiosHttpClient;

  beforeEach(() => {
    client = new AxiosHttpClient();
    jest.clearAllMocks();
  });

  describe('post', () => {
    it('debería realizar una petición POST', async () => {
      const axios = require('axios');
      axios.post.mockResolvedValue({ data: { id: 1 }, status: 201 });

      const result = await client.post('http://api.test.com', { key: 'value' });

      expect(result.data).toEqual({ id: 1 });
      expect(result.status).toBe(201);
      expect(axios.post).toHaveBeenCalledWith('http://api.test.com', { key: 'value' }, {});
    });

    it('debería pasar headers cuando se proporcionan', async () => {
      const axios = require('axios');
      axios.post.mockResolvedValue({ data: {}, status: 200 });

      await client.post('http://api.test.com', {}, { Authorization: 'Bearer token' });

      expect(axios.post).toHaveBeenCalledWith(
        'http://api.test.com',
        {},
        { headers: { Authorization: 'Bearer token' } },
      );
    });
  });

  describe('get', () => {
    it('debería realizar una petición GET', async () => {
      const axios = require('axios');
      axios.get.mockResolvedValue({ data: { items: [] }, status: 200 });

      const result = await client.get('http://api.test.com');

      expect(result.data).toEqual({ items: [] });
      expect(axios.get).toHaveBeenCalledWith('http://api.test.com', {});
    });

    it('debería pasar headers en GET', async () => {
      const axios = require('axios');
      axios.get.mockResolvedValue({ data: {}, status: 200 });

      await client.get('http://api.test.com', { Authorization: 'Bearer token' });

      expect(axios.get).toHaveBeenCalledWith(
        'http://api.test.com',
        { headers: { Authorization: 'Bearer token' } },
      );
    });
  });
});
