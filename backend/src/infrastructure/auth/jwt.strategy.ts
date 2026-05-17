import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../domain/entities/patient.entity';
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
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: keycloakConfig.jwksUri,
      }),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: DecodedToken) {
    if (!payload) {
      throw new UnauthorizedException('Token inválido.');
    }

    const roles = payload.realm_access?.roles || [];

    let localId = payload.sub;
    let localRole: string | undefined;

    const patient = await this.patientRepository.findOneBy({
      keycloakId: payload.sub,
    });
    if (patient) {
      localId = patient.id;
      localRole = 'patient';
    } else {
      const staff = await this.userRepository.findOneBy({
        keycloakId: payload.sub,
      });
      if (staff) {
        localId = staff.id;
        localRole = staff.role;
      }
    }

    return {
      id: localId,
      keycloakId: payload.sub,
      email: payload.email,
      document: payload.preferred_username,
      roles,
      localRole,
    };
  }
}
