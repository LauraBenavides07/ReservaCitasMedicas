import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakService } from './keycloak.service';
import { KeycloakConfig } from './keycloak-config';
import { IHttpClient } from '../../application/abstractions/ihttp-client.interface';

describe('KeycloakService', () => {
  let service: KeycloakService;

  const mockHttpClient = {
    post: jest.fn(),
    get: jest.fn(),
  };

  const mockConfig = {
    url: 'http://127.0.0.1:8080',
    realm: 'piedrazul',
    clientId: 'piedrazul-app',
    adminUsername: 'admin',
    adminPassword: 'admin',
    tokenUrl: 'http://127.0.0.1:8080/realms/piedrazul/protocol/openid-connect/token',
    adminTokenUrl: 'http://127.0.0.1:8080/realms/master/protocol/openid-connect/token',
    usersAdminUrl: 'http://127.0.0.1:8080/admin/realms/piedrazul/users',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeycloakService,
        { provide: IHttpClient, useValue: mockHttpClient },
        { provide: KeycloakConfig, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<KeycloakService>(KeycloakService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('debería autenticar usuario contra Keycloak', async () => {
      const tokenResponse = {
        data: {
          access_token: 'jwt-token-123',
          token_type: 'Bearer',
          expires_in: 300,
        },
        status: 200,
      };
      mockHttpClient.post.mockResolvedValue(tokenResponse);

      const result = await service.login('password123', 'juanperez');
      expect(result.access_token).toBe('jwt-token-123');
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        mockConfig.tokenUrl,
        expect.any(String),
        { 'Content-Type': 'application/x-www-form-urlencoded' },
      );
    });
  });

  describe('createUser', () => {
    it('debería crear un usuario en Keycloak', async () => {
      mockHttpClient.post
        .mockResolvedValueOnce({
          data: { access_token: 'admin-token' },
          status: 200,
        })
        .mockResolvedValueOnce({
          data: { id: 'kc-user-id' },
          status: 201,
        });

      await service.createUser({
        username: 'juanperez',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        password: 'secure123',
      });

      expect(mockHttpClient.post).toHaveBeenCalledTimes(2);
      expect(mockHttpClient.post).toHaveBeenNthCalledWith(
        2,
        mockConfig.usersAdminUrl,
        expect.objectContaining({
          username: 'juanperez',
          enabled: true,
          firstName: 'Juan',
          lastName: 'Pérez',
        }),
        expect.objectContaining({
          Authorization: expect.stringContaining('Bearer'),
        }),
      );
    });
  });
});
