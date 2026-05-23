import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Patient } from '../../domain/entities/patient.entity';
import { IPatientRepository } from '../ports/patient.repository';

@Injectable()
export class PatientService {
  constructor(
    @Inject(IPatientRepository)
    private readonly patientRepository: IPatientRepository,
  ) {}

  async findByDocument(document: string): Promise<Patient> {
    const patient = await this.patientRepository.findOneBy({ document });
    if (!patient) {
      throw new NotFoundException('Paciente no encontrado.');
    }
    return patient;
  }

  async findByDocumentOrCreate(data: {
    document: string;
    firstName: string;
    lastName: string;
    phone: string;
    gender?: string;
  }): Promise<Patient> {
    let patient = await this.patientRepository.findOneBy({
      document: data.document,
    });
    if (!patient) {
      try {
        const patientData = { ...data, gender: data.gender || 'O' };
        patient = this.patientRepository.create(patientData);
        await this.patientRepository.save(patient);
      } catch (error: unknown) {
        const pgError = error as { code?: string };
        if (pgError?.code === '23505') {
          patient = await this.patientRepository.findOneBy({
            document: data.document,
          });
          if (!patient) throw error;
        } else {
          throw error;
        }
      }
    }
    return patient;
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientRepository.findOneBy({ id });
    if (!patient) {
      throw new NotFoundException('Paciente no encontrado.');
    }
    return patient;
  }

  async updateMedicalInfo(
    id: string,
    data: { diagnosis?: string; observations?: string },
  ): Promise<Patient> {
    const patient = await this.findOne(id);
    if (data.diagnosis !== undefined) patient.diagnosis = data.diagnosis;
    if (data.observations !== undefined) patient.observations = data.observations;
    return this.patientRepository.save(patient);
  }
}
