import { IsNumber, Min } from 'class-validator';

export class UpdateConfigDto {
  @IsNumber()
  @Min(1)
  minAdvanceHours: number;

  @IsNumber()
  @Min(1)
  appointmentWindowDays: number;
}
