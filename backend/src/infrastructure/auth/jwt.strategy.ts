import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    // URL base de Keycloak. Por defecto es localhost:8080.
    const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    const realm = process.env.KEYCLOAK_REALM || 'piedrazul';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Usamos jwks-rsa para obtener la llave pública de Keycloak y validar la firma del token
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`,
      }),
      // Opcional: Validar el emisor
      issuer: `${keycloakUrl}/realms/${realm}`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException('Token inválido.');
    }
    
    // Keycloak guarda los roles en 'realm_access.roles'
    const roles = payload.realm_access?.roles || [];
    
    // Devolvemos la info del usuario. El backend ahora confía en Keycloak.
    return { 
      id: payload.sub, 
      email: payload.email,
      document: payload.preferred_username, // Usualmente el username en Keycloak es el documento
      roles: roles 
    };
  }
}
