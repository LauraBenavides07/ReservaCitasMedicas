import { Injectable } from '@nestjs/common';

@Injectable()
export class KeycloakConfig {
  readonly url: string;
  readonly realm: string;
  readonly clientId: string;
  readonly adminUsername: string;
  readonly adminPassword: string;

  constructor() {
    this.url = process.env.KEYCLOAK_URL || 'http://127.0.0.1:8080';
    this.realm = process.env.KEYCLOAK_REALM || 'piedrazul';
    this.clientId = process.env.KEYCLOAK_CLIENT_ID || 'piedrazul-app';
    this.adminUsername = process.env.KEYCLOAK_ADMIN || 'admin';
    this.adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
  }

  get tokenUrl(): string {
    return `${this.url}/realms/${this.realm}/protocol/openid-connect/token`;
  }

  get adminTokenUrl(): string {
    return `${this.url}/realms/master/protocol/openid-connect/token`;
  }

  get usersAdminUrl(): string {
    return `${this.url}/admin/realms/${this.realm}/users`;
  }

  get jwksUri(): string {
    return `${this.url}/realms/${this.realm}/protocol/openid-connect/certs`;
  }
}
