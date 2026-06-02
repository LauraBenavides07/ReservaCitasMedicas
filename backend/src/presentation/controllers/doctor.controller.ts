import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { DoctorService } from '../../application/services/doctor.service';
import { DoctorExceptionService } from '../../application/services/doctor-exception.service';
import { CreateDoctorDto } from '../dto/create-doctor.dto';
import { UpdateDoctorDto } from '../dto/update-doctor.dto';
import { CreateExceptionDto } from '../dto/create-exception.dto';
import { Doctor } from '../../domain/entities/doctor.entity';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { AuthService } from '../../application/services/auth.service';

@Controller('doctors')
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly doctorExceptionService: DoctorExceptionService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async getDoctors() {
    return this.doctorService.findAll();
  }

  @Get(':id')
  async getDoctor(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createDoctor(@Body() data: CreateDoctorDto) {
    return this.doctorService.create(data);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateDoctor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateDoctorDto,
  ) {
    return this.doctorService.update(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteDoctor(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/exceptions')
  async addException(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: CreateExceptionDto,
  ) {
    return this.doctorExceptionService.add({
      ...data,
      doctor: { id } as Doctor,
    });
  }

  @Get(':id/exceptions')
  async getExceptions(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorExceptionService.findByDoctor(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reset-password')
  async resetPassword(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.resetPassword(id);  // ← doctorService, no authService
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/exceptions/:exceptionId')
  async removeException(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('exceptionId', ParseUUIDPipe) exceptionId: string,
  ) {
    return this.doctorExceptionService.remove(exceptionId);
  }
}
