import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { User } from '../../domain/entities/user.entity';
import { DecodedToken } from '../../domain/types/keycloak.types';
import { KeycloakConfig } from './keycloak-config';
import { IPatientRepository } from '../../application/ports/patient.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(IPatientRepository)
    private patientRepository: IPatientRepository,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    keycloakConfig: KeycloakConfig,
  ) {
    const keycloakSecretProvider = passportJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: keycloakConfig.jwksUri,
    });

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request: Request, rawJwtToken: string | undefined, done: (err: any, secret?: any) => void) => {
        if (rawJwtToken) {
          const parts = rawJwtToken.split('.');
          if (parts.length === 3) {
            try {
              const header = JSON.parse(
                Buffer.from(parts[0], 'base64').toString(),
              ) as Record<string, unknown>;

              if (header.alg === 'HS256') {
                return done(
                  null,
                  process.env.JWT_SECRET || 'PIEDRAZUL_SECRET_KEY',
                );
              }
            } catch {
              // fall through to Keycloak JWKS secret provider
            }
          }
        }
        return keycloakSecretProvider(request, rawJwtToken, done);
      },
      algorithms: ['RS256', 'HS256'],
    });
  }

  async validate(payload: DecodedToken) {
    if (!payload) {
      throw new UnauthorizedException('Token inválido.');
    }

    let localId = payload.sub;
    const customRole = (payload as unknown as Record<string, unknown>).role as
      | string
      | undefined;
    let localRole = customRole;

    const patient = await this.patientRepository.findOneBy([
      { keycloakId: payload.sub },
      { id: payload.sub },
    ]);
    if (patient) {
      localId = patient.id;
      localRole = 'patient';
    } else {
      const staff = await this.userRepository.findOneBy([
        { keycloakId: payload.sub },
        { id: payload.sub },
      ]);
      if (staff) {
        localId = staff.id;
        localRole = staff.role;
      }
    }

    const roles = payload.realm_access?.roles || (localRole ? [localRole] : []);

    return {
      id: localId,
      keycloakId: payload.sub,
      email: payload.email,
      document:
        payload.preferred_username || (patient ? patient.document : undefined),
      roles,
      localRole,
    };
  }
}
