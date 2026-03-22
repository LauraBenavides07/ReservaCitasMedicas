import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  login: string; // Document or Email

  @IsString()
  @IsNotEmpty()
  password: string;
}
