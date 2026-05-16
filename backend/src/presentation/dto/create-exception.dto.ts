import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateExceptionDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
