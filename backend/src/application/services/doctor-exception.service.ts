import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DoctorException } from '../../domain/entities/doctor-exception.entity';
import { IDoctorExceptionRepository } from '../ports/doctor-exception.repository';
import { IDoctorRepository } from '../ports/doctor.repository';

@Injectable()
export class DoctorExceptionService {
  constructor(
    @Inject(IDoctorExceptionRepository)
    private readonly exceptionRepository: IDoctorExceptionRepository,
    @Inject(IDoctorRepository)
    private readonly doctorRepository: IDoctorRepository,
  ) {}

  async findByDoctor(doctorId: string): Promise<DoctorException[]> {
    return this.exceptionRepository.find({
      where: { doctorId },
    });
  }

  async add(data: Partial<DoctorException>): Promise<DoctorException> {
    const doctor = await this.doctorRepository.findOneBy({
      id: data.doctorId,
    });
    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }

    const exception = this.exceptionRepository.create(data);
    return this.exceptionRepository.save(exception);
  }

  async remove(id: string): Promise<void> {
    const exception = await this.exceptionRepository.findOneBy({ id });
    if (!exception) {
      throw new NotFoundException('Excepción no encontrada');
    }
    await this.exceptionRepository.delete(id);
  }
}
