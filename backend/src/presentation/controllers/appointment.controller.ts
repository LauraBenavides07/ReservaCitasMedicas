import { Controller, Get, Post, Body, Query, ParseIntPipe, UseGuards, Req, Patch, Param } from '@nestjs/common';
import { AppointmentService } from '../../application/services/appointment.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  /**
   * REQUISITO 1: Listar citas (Agendador)
   */
  @Get()
  async getAppointments(
    @Query('doctorId', ParseIntPipe) doctorId: number,
    @Query('date') date: string,
  ) {
    return this.appointmentService.findAllByDoctorAndDate(doctorId, date);
  }

  /**
   * REQUISITO 3: Listar mis citas (Paciente)
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-appointments')
  async getPatientAppointments(@Req() req) {
    return this.appointmentService.findAllByPatient(req.user.id);
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
  async cancelPatientAppointment(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.appointmentService.cancelAppointment(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reschedule')
  async reschedulePatientAppointment(@Param('id', ParseIntPipe) id: number, @Req() req, @Body() body: { date: string, time: string }) {
    return this.appointmentService.reschedule(id, req.user.id, body.date, body.time);
  }

  /**
   * REQUISITO 2: Consultar disponibilidad
   */
  @Get('available-slots')
  async getAvailableSlots(
    @Query('doctorId', ParseIntPipe) doctorId: number,
    @Query('date') date: string,
  ) {
    return this.appointmentService.getAvailableSlots(doctorId, date);
  }
}
