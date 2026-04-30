import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Req,
  Patch,
  Param,
  Res,
} from '@nestjs/common';
import { Request } from 'express';
import type { Response } from 'express';
import { AppointmentService } from '../../application/services/appointment.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  /**
   * REQUISITO 8: Estadisticas Globales
   */
  @Get('stats')
  async getDashboardStats() {
    return this.appointmentService.getDashboardStats();
  }

  /**
   * REQUISITO 5: Exportar citas (Agendador/Médico)
   */
  @Get('export')
  async exportAppointments(
    @Query('date') date: string,
    @Query('doctorId', ParseUUIDPipe) doctorId: string,
    @Res() res: Response,
  ) {
    const csv = await this.appointmentService.exportAppointmentsByDateAndDoctor(
      date,
      doctorId,
    );

    res.header('Content-Type', 'text/csv');
    res.attachment(`citas-${date}.csv`);
    res.send(csv);
  }

  /**
   * REQUISITO 1: Listar citas (Agendador)
   */
  @Get()
  async getAppointments(
    @Query('doctorId', ParseUUIDPipe) doctorId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentService.findAllByDoctorAndDate(doctorId, date);
  }

  /**
   * REQUISITO 3: Listar mis citas (Paciente)
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-appointments')
  async getPatientAppointments(@Req() req: Request & { user: { id: string, document: string } }) {
    console.log('--- Fetching appointments for patient ---');
    console.log('User in request:', req.user);
    const appointments = await this.appointmentService.findAllByPatient(req.user.id);
    console.log('Found appointments:', appointments.length);
    return appointments;
  }

  /**
   * REQUISITO 2/3: Crear cita
   */
  @Post()
  async createAppointment(@Body() createDto: CreateAppointmentDto) {
    return this.appointmentService.create(createDto);
  }

  /**
   * REQUISITO 3: Cancelar cita (Paciente)
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  async cancelPatientAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.appointmentService.cancelAppointment(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reschedule')
  async reschedulePatientAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: { id: string } },
    @Body() body: { date: string; time: string },
  ) {
    return this.appointmentService.reschedule(
      id,
      req.user.id,
      body.date,
      body.time,
    );
  }

  /**
   * REQUISITO 2: Consultar disponibilidad
   */
  @Get('available-slots')
  async getAvailableSlots(
    @Query('doctorId', ParseUUIDPipe) doctorId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentService.getAvailableSlots(doctorId, date);
  }
  /**
   * Listar TODAS las citas (sin filtrar por médico)
   */
  @Get('all')
  async findAllAppointments() {
    return this.appointmentService.findAll();
  }

  /**
   * Buscar paciente por documento
   */
  @Get('patient-by-document/:document')
  async getPatientByDocument(@Param('document') document: string) {
    return this.appointmentService.findPatientByDocument(document);
  }
}
