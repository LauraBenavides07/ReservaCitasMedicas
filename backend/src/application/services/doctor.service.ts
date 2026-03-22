import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../../domain/entities/doctor.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}

  async findAll() {
    return this.doctorRepository.find();
  }

  async findOne(id: number) {
    const doctor = await this.doctorRepository.findOneBy({ id });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    return doctor;
  }

  async create(data: Partial<Doctor>) {
    const doctor = this.doctorRepository.create(data);
    return this.doctorRepository.save(doctor);
  }

  async update(id: number, data: Partial<Doctor>) {
    await this.findOne(id);
    await this.doctorRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    const doctor = await this.findOne(id);
    return this.doctorRepository.remove(doctor);
  }
}
