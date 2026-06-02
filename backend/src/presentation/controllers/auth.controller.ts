import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('patient/:document')
  async getPatientByDocument(@Param('document') document: string) {
    return this.authService.getPatientByDocument(document);
  }

  // verifica si un documento ya está registrado
  @Get('existe-documento/:document')
  async existeDocumento(@Param('document') document: string) {
    return this.authService.existeDocumento(document);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: Request & { user: { id: string } },
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset-doctor-password/:doctorId')
  async resetDoctorPassword(@Param('doctorId') doctorId: string) {
    return this.authService.resetDoctorPassword(doctorId);
  }

  @Get('existe-email/:email')
  async existeEmail(@Param('email') email: string) {
    return this.authService.existeEmail(email);
  }
}
