import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { PatientService } from '../../application/services/patient.service';

class UpdateMedicalInfoDto {
  diagnosis?: string;
  observations?: string;
}

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.patientService.findAll();
  }

  @Patch(':id/medical-info')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async updateMedicalInfo(
    @Param('id') id: string,
    @Body() dto: UpdateMedicalInfoDto,
  ) {
    return this.patientService.updateMedicalInfo(id, dto);
  }
}
