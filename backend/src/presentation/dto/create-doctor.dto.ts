import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Matches,
} from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'scheduleStart debe tener formato HH:mm' })
  @IsOptional()
  scheduleStart?: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'scheduleEnd debe tener formato HH:mm' })
  @IsOptional()
  scheduleEnd?: string;

  @IsNumber()
  @Min(5)
  @IsOptional()
  slotDuration?: number;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'lunchStart debe tener formato HH:mm' })
  @IsOptional()
  lunchStart?: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'lunchEnd debe tener formato HH:mm' })
  @IsOptional()
  lunchEnd?: string;

  @IsString()
  @IsOptional()
  activeDays?: string;
}
