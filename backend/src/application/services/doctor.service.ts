import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { Doctor } from '../../domain/entities/doctor.entity';
import { IDoctorRepository } from '../ports/doctor.repository';
import { IAppointmentRepository } from '../ports/appointment.repository';

@Injectable()
export class DoctorService {
  private readonly logger = new Logger(DoctorService.name);

  constructor(
    @Inject(IDoctorRepository)
    private readonly doctorRepository: IDoctorRepository,
    @Inject(IAppointmentRepository)
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async findAll(): Promise<Doctor[]> {
    return this.doctorRepository.find();
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOneBy({ id });
    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }
    return doctor;
  }

  async create(data: Partial<Doctor>): Promise<Doctor> {
    const doctor = this.doctorRepository.create(data);
    return this.doctorRepository.save(doctor);
  }

  async update(id: string, data: Partial<Doctor>): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOneBy({ id });
    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }
    await this.doctorRepository.update(id, data);
    const updated = await this.doctorRepository.findOneBy({ id });
    if (!updated) {
      throw new NotFoundException('Doctor no encontrado después de actualizar');
    }
    return updated;
  }

  async remove(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOneBy({ id });
    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }

    const count = await this.appointmentRepository.count({
      where: { doctor: { id } },
    });
    if (count > 0) {
      throw new BadRequestException(
        'No se puede eliminar un médico con citas agendadas',
      );
    }

    return this.doctorRepository.remove(doctor);
  }
}
