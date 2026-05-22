import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ICsvExporter } from '../abstractions/icsv-exporter.interface';
import { IAppointmentRepository } from '../ports/appointment.repository';

@Injectable()
export class ExportService {
  constructor(
    @Inject(IAppointmentRepository)
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly csvExporter: ICsvExporter,
  ) {}

  async exportAppointmentsByDateAndDoctor(
    date: string,
    doctorId: string,
  ): Promise<string> {
    const appointments = await this.appointmentRepository.find({
      where: {
        appointmentDate: date,
        doctor: { id: doctorId },
      },
      relations: { patient: true, doctor: true },
      order: { appointmentTime: 'ASC' },
    });

    if (!appointments.length) {
      throw new NotFoundException('No hay citas para esa fecha');
    }

    const formatted = appointments.map((app) => ({
      Hora: app.appointmentTime,
      Paciente: `${app.patient.firstName} ${app.patient.lastName}`,
      Documento: app.patient.document,
      Telefono: app.patient.phone,
      Estado: app.status,
    }));

    return this.csvExporter.export(formatted);
  }
}
