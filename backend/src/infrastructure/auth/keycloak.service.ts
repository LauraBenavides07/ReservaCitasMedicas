import { Injectable, Logger } from '@nestjs/common';
import { IHttpClient } from '../../application/abstractions/ihttp-client.interface';
import { KeycloakConfig } from './keycloak-config';
import { KeycloakTokenResponse } from '../../domain/types/keycloak.types';

@Injectable()
export class KeycloakService {
  private readonly logger = new Logger(KeycloakService.name);

  constructor(
    private readonly httpClient: IHttpClient,
    private readonly config: KeycloakConfig,
  ) {}

  async login(password: string, username: string): Promise<KeycloakTokenResponse> {
    const params = new URLSearchParams();
    params.append('client_id', this.config.clientId);
    params.append('grant_type', 'password');
    params.append('username', username);
    params.append('password', password);

    const response = await this.httpClient.post<KeycloakTokenResponse>(
      this.config.tokenUrl,
      params.toString(),
      { 'Content-Type': 'application/x-www-form-urlencoded' },
    );
    return response.data;
  }

  async createUser(data: {
    username: string;
    firstName: string;
    lastName: string;
    email?: string;
    password: string;
  }): Promise<void> {
    const adminToken = await this.getAdminToken();

    await this.httpClient.post(
      this.config.usersAdminUrl,
      {
        username: data.username,
        enabled: true,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        credentials: [
          { type: 'password', value: data.password, temporary: false },
        ],
      },
      { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    );

    this.logger.log(`Usuario ${data.username} sincronizado con Keycloak`);
  }

  private async getAdminToken(): Promise<string> {
    const params = new URLSearchParams();
    params.append('client_id', 'admin-cli');
    params.append('grant_type', 'password');
    params.append('username', this.config.adminUsername);
    params.append('password', this.config.adminPassword);

    const response = await this.httpClient.post<KeycloakTokenResponse>(
      this.config.adminTokenUrl,
      params.toString(),
      { 'Content-Type': 'application/x-www-form-urlencoded' },
    );
    return response.data.access_token;
  }
}
