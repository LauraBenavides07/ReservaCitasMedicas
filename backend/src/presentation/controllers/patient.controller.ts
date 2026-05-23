import { Controller, Patch, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { PatientService } from '../../application/services/patient.service';

class UpdateMedicalInfoDto {
  diagnosis?: string;
  observations?: string;
}

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Patch(':id/medical-info')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateMedicalInfo(
    @Param('id') id: string,
    @Body() dto: UpdateMedicalInfoDto,
  ) {
    return this.patientService.updateMedicalInfo(id, dto);
  }
}
