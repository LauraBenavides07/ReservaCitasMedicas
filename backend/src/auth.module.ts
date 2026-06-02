import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Patient } from './domain/entities/patient.entity';
import { User } from './domain/entities/user.entity';
import { AuthService } from './application/services/auth.service';
import { AuthController } from './presentation/controllers/auth.controller';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { IPasswordHasher } from './application/abstractions/ipassword-hasher.interface';
import { BcryptPasswordHasher } from './infrastructure/auth/bcrypt-password-hasher';
import { IHttpClient } from './application/abstractions/ihttp-client.interface';
import { AxiosHttpClient } from './infrastructure/auth/axios-http-client';
import { KeycloakConfig } from './infrastructure/auth/keycloak-config';
import { KeycloakService } from './infrastructure/auth/keycloak.service';
import { IPatientRepository } from './application/ports/patient.repository';
import { TypeOrmPatientRepository } from './infrastructure/persistence/typeorm-patient.repository';
import { Doctor } from './domain/entities/doctor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, User, Doctor]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'PIEDRAZUL_SECRET_KEY'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    KeycloakConfig,
    KeycloakService,
    { provide: IPasswordHasher, useClass: BcryptPasswordHasher },
    { provide: IHttpClient, useClass: AxiosHttpClient },
    { provide: IPatientRepository, useClass: TypeOrmPatientRepository },
  ],
  controllers: [AuthController],
  exports: [AuthService, IPatientRepository],
})
export class AuthModule {}
