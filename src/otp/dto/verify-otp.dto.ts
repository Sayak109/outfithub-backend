import { PartialType } from '@nestjs/mapped-types';
import { SendOtpDto } from './send-otp.dto';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class verifyOtpDto extends PartialType(SendOtpDto) {

    @IsNumber()
    @IsNotEmpty()
    otp: number
}
