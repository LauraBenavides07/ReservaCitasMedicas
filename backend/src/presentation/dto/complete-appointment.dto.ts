import { IsString, IsOptional } from 'class-validator';

export class CompleteAppointmentDto {
  @IsString()
  @IsOptional()
  observations?: string;

  @IsString()
  @IsOptional()
  diagnosis?: string;
}
