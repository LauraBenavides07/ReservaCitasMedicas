export interface KeycloakTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface DecodedToken {
  sub: string;
  preferred_username: string;
  email: string;
  realm_access?: {
    roles: string[];
  };
  iat: number;
  exp: number;
}

export interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
}

export interface UserData {
  id: string;
  document?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
}

export interface DbUser {
  id: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  document?: string;
  email?: string;
  role?: string;
}
