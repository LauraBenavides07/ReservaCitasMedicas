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
import { DoctorService } from '../../application/services/doctor.service';
import { CreateDoctorDto } from '../dto/create-doctor.dto';
import { UpdateDoctorDto } from '../dto/update-doctor.dto';
import { CreateExceptionDto } from '../dto/create-exception.dto';

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
  async createDoctor(@Body() data: CreateDoctorDto) {
    return this.doctorService.create(data);
  }

  @Patch(':id')
  async updateDoctor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateDoctorDto,
  ) {
    return this.doctorService.update(id, data);
  }

  @Delete(':id')
  async deleteDoctor(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.remove(id);
  }

  @Post(':id/exceptions')
  async addException(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: CreateExceptionDto,
  ) {
    return this.doctorService.addException({ ...data, doctorId: id });
  }

  @Get(':id/exceptions')
  async getExceptions(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.getExceptions(id);
  }

  @Delete(':id/exceptions/:exceptionId')
  async removeException(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('exceptionId', ParseUUIDPipe) exceptionId: string,
  ) {
    return this.doctorService.removeException(exceptionId);
  }
}
