import { IsBoolean, IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;

  @IsBoolean()
  is_mobile: boolean;
}