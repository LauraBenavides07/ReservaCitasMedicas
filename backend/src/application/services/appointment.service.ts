import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../../domain/entities/appointment.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  /**
   * Requisito 1: Listar citas por médico y fecha
   */
  async findAllByDoctorAndDate(doctorId: number, date: string) {
    const [appointments, total] = await this.appointmentRepository.findAndCount({
      where: {
        doctor: { id: doctorId },
        date: date,
      },
      relations: ['patient', 'doctor'],
      order: {
        time: 'ASC',
      },
    });

    return {
      appointments,
      total,
    };
  }
}
