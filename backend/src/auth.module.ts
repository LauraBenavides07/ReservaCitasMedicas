import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './domain/entities/patient.entity';
import { User } from './domain/entities/user.entity';
import { AuthService } from './application/services/auth.service';
import { AuthController } from './presentation/controllers/auth.controller';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, User]),
    PassportModule,
    JwtModule.register({
      secret: 'PIEDRAZUL_SECRET_KEY', // Debe ser env var en producción
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
