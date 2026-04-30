import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../domain/entities/patient.entity';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    // URL base de Keycloak. Por defecto es localhost:8080.
    const keycloakUrl = process.env.KEYCLOAK_URL || 'http://127.0.0.1:8080';
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

  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException('Token inválido.');
    }
    
    const roles = payload.realm_access?.roles || [];
    const username = payload.preferred_username; // En nuestro caso, CC para pacientes o Email para staff
    
    // Buscamos estrictamente por keycloakId (Identity Linking Profesional)
    let localId = payload.sub; // Fallback
    
    const patient = await this.patientRepository.findOneBy({ keycloakId: payload.sub });
    if (patient) {
      localId = patient.id;
    } else {
      const staff = await this.userRepository.findOneBy({ keycloakId: payload.sub });
      if (staff) {
        localId = staff.id;
      }
    }
    
    return { 
      id: localId, 
      keycloakId: payload.sub,
      email: payload.email,
      document: username,
      roles: roles 
    };
  }
}
