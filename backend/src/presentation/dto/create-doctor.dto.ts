import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  IsArray,
  Min,
  Matches,
  Length,
  IsEmail,
} from 'class-validator';

export class CreateDoctorDto {

  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  document: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  specialty?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'scheduleStart debe tener formato HH:mm',
  })
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

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  activeDays?: number[];
}
