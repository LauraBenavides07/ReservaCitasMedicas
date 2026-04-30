import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Doctor } from '../../domain/entities/doctor.entity';
import { DoctorException } from '../../domain/entities/doctor-exception.entity';
import { DoctorService } from '../../application/services/doctor.service';

@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  async getDoctors() {
    return this.doctorService.findAll();
  }

  @Get(':id')
  async getDoctor(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.findOne(id);
  }

  @Post()
  async createDoctor(@Body() data: Partial<Doctor>) {
    return this.doctorService.create(data);
  }

  @Patch(':id')
  async updateDoctor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<Doctor>,
  ) {
    return this.doctorService.update(id, data);
  }

  @Delete(':id')
  async deleteDoctor(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.remove(id);
  }

  // --- Excepciones ---
  @Post(':id/exceptions')
  async addException(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<DoctorException>,
  ) {
    return this.doctorService.addException({ ...data, doctorId: id });
  }

  @Get(':id/exceptions')
  async getExceptions(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.getExceptions(id);
  }

  @Delete('exceptions/:exceptionId')
  async removeException(@Param('exceptionId', ParseUUIDPipe) id: string) {
    return this.doctorService.removeException(id);
  }
}
