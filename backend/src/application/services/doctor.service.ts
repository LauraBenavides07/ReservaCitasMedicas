import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../../domain/entities/doctor.entity';
import { Appointment } from '../../domain/entities/appointment.entity';
import { DoctorException } from '../../domain/entities/doctor-exception.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(DoctorException)
    private exceptionRepository: Repository<DoctorException>,
  ) {}

  async findAll() {
    return this.doctorRepository.find();
  }

  async findOne(id: string) {
    const doctor = await this.doctorRepository.findOneBy({ id });
    if (!doctor) {
      throw new NotFoundException(`Doctor con ID ${id} no encontrado`);
    }
    return doctor;
  }

  async create(data: Partial<Doctor>) {
    const doctor = this.doctorRepository.create(data);
    return this.doctorRepository.save(doctor);
  }

  async update(id: string, data: Partial<Doctor>) {
    await this.findOne(id);
    await this.doctorRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const doctor = await this.findOne(id);

    // Verificar si el doctor tiene citas agendadas
    const count = await this.appointmentRepository.count({
      where: {
        doctor: { id },
        status: 'agendada',
      },
    });

    if (count > 0) {
      throw new BadRequestException(
        'No se puede eliminar porque tiene citas agendadas.',
      );
    }

    return this.doctorRepository.remove(doctor);
  }

  // --- Módulo de Excepciones ---
  async addException(data: Partial<DoctorException>) {
    const exception = this.exceptionRepository.create(data);
    return this.exceptionRepository.save(exception);
  }

  async getExceptions(doctorId: string) {
    return this.exceptionRepository.find({
      where: { doctorId },
      order: { date: 'ASC' },
    });
  }

  async removeException(id: string) {
    return this.exceptionRepository.delete(id);
  }
}
