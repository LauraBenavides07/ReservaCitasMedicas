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
import { AvailabilityService } from '../../application/services/availability.service';
import { StatsService } from '../../application/services/stats.service';
import { ExportService } from '../../application/services/export.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { CompleteAppointmentDto } from '../dto/complete-appointment.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';

@Controller('appointments')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly availabilityService: AvailabilityService,
    private readonly statsService: StatsService,
    private readonly exportService: ExportService,
  ) {}

  @Get('stats')
  async getDashboardStats() {
    return this.statsService.getDashboardStats();
  }

  @Get('export')
  async exportAppointments(
    @Query('date') date: string,
    @Query('doctorId', ParseUUIDPipe) doctorId: string,
    @Res() res: Response,
  ) {
    const csv = await this.exportService.exportAppointmentsByDateAndDoctor(
      date,
      doctorId,
    );

    res.header('Content-Type', 'text/csv');
    res.attachment(`citas-${date}.csv`);
    res.send(csv);
  }

  @Get()
  async getAppointments(
    @Query('doctorId', ParseUUIDPipe) doctorId: string,
    @Query('date') date: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.appointmentService.findAllByDoctorAndDate(
      doctorId,
      date,
      skip ? Number(skip) : 0,
      take ? Number(take) : 100,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-appointments')
  async getPatientAppointments(
    @Req() req: Request & { user: { id: string; document: string } },
  ) {
    const appointments = await this.appointmentService.findAllByPatient(
      req.user.id,
      req.user.document,
    );
    return appointments;
  }

  @Post()
  async createAppointment(@Body() createDto: CreateAppointmentDto) {
    return this.appointmentService.create(createDto);
  }

  @Get('available-slots')
  async getAvailableSlots(
    @Query('doctorId', ParseUUIDPipe) doctorId: string,
    @Query('date') date: string,
  ) {
    return this.availabilityService.getAvailableSlots(doctorId, date);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  async cancelPatientAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: { id: string; localRole?: string } },
  ) {
    return this.appointmentService.cancelAppointment(
      id,
      req.user.id,
      req.user.localRole,
    );
  }

  @Patch(':id/confirm')
  async confirmAppointment(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.confirmAppointment(id);
  }

  @Patch(':id/complete')
  async completeAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() completeDto: CompleteAppointmentDto,
  ) {
    return this.appointmentService.completeAppointment(
      id,
      completeDto.observations,
      completeDto.diagnosis,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reschedule')
  async rescheduleAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: { id: string; localRole?: string } },
    @Body() body: { date: string; time: string; doctorId?: string },
  ) {
    return this.appointmentService.reschedule(
      id,
      req.user.id,
      body.date,
      body.time,
      req.user.localRole,
      body.doctorId,
    );
  }

  @Get('patient-by-document/:document')
  async findPatientByDocument(@Param('document') document: string) {
    return this.appointmentService.findPatientByDocument(document);
  }

  @Get('all')
  async findAllAppointments() {
    return this.appointmentService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/history')
  async getAppointmentHistory(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.appointmentService.getAppointmentHistory(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history/all')
  async getAllHistory(
    @Query('appointmentId') appointmentId?: string,
    @Query('changeType') changeType?: string,
    @Query('limit') limit?: string,
  ) {
    return this.appointmentService.getAllHistory({
      appointmentId,
      changeType,
      limit: limit ? Number(limit) : 50,
    });
  }
}
