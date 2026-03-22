import { Controller, Get, Param, ParseIntPipe, Post, Body, Patch, Delete } from '@nestjs/common';
import { DoctorService } from '../../application/services/doctor.service';

@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  async getDoctors() {
    return this.doctorService.findAll();
  }

  @Get(':id')
  async getDoctor(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.findOne(id);
  }

  @Post()
  async createDoctor(@Body() data: any) {
    return this.doctorService.create(data);
  }

  @Patch(':id')
  async updateDoctor(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.doctorService.update(id, data);
  }

  @Delete(':id')
  async deleteDoctor(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.remove(id);
  }
}
