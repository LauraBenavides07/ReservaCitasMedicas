import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { AppointmentService } from '../../application/services/appointment.service';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  /**
   * GET /appointments?doctorId=1&date=2026-03-22
   */
  @Get()
  async getAppointments(
    @Query('doctorId', ParseIntPipe) doctorId: number,
    @Query('date') date: string,
  ) {
    return this.appointmentService.findAllByDoctorAndDate(doctorId, date);
  }
}
