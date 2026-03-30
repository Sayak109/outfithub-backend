import { BadRequestException, Injectable } from '@nestjs/common';
import { MailService } from '@/mail/mail.service';
import { PrismaService } from '@/prisma/prisma.service';
import { generateOTP } from '@/common/helper/common.helper';
import { SendOtpDto } from './dto/send-otp.dto';
import { verifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService
  ) { }
  async sendOtp(dto: SendOtpDto) {
    try {
      const find = await this.prisma.oTP.findFirst({
        where: {
          credential: dto.credential,
        }
      })
      let currentDate = new Date();
      let ex_at = new Date(currentDate.getTime() + 1 * 60000); // 1 minutes in milliseconds
      const otp = generateOTP()
      const subject = "Email OTP Verification"
      console.log(otp, "otpeouireuroweir")
      if (find) {
        const createOtp = await this.prisma.oTP.update({
          where: {
            id: find.id,
          },
          data: {
            OTP: Number(otp),
            limit: 0,
            expire_at: ex_at
          }
        })
      } else {
        const createOtp = await this.prisma.oTP.create({
          data: {
            credential: dto.credential,
            OTP: Number(otp),
            expire_at: ex_at
          }
        })
      }

      if (dto.is_email) {
        setImmediate(async () => {
          try {
            await this.mailService.sendOTPEmail(subject, dto.credential, otp);
          } catch (error) {
            console.error("Error sending OTP", error);
          }
        });
      } else {

      }
      return true;
    } catch (error) {
      throw error
    }
  }

  async verifyOtp(dto: verifyOtpDto) {
    try {
      const otpRecord = await this.prisma.oTP.findFirst({
        where: {
          credential: dto.credential
        },
        select: {
          id: true,
          OTP: true,
          limit: true,
          expire_at: true,
          updated_at: true
        }
      });

      if (!otpRecord) {
        throw new BadRequestException('OTP not found for this credential.');
      }

      if (otpRecord?.limit >= 3) {
        throw new BadRequestException('You tried too many attempts. Try again later.');
      }

      const now = new Date();
      if (otpRecord.expire_at < now) {
        throw new BadRequestException('OTP has expired.');
      }

      if (otpRecord.OTP !== dto.otp) {
        await this.prisma.oTP.update({
          where: { id: otpRecord.id },
          data: {
            limit: { increment: 1 },
            updated_at: new Date()
          }
        });
        throw new BadRequestException('Invalid OTP.');
      }

      await this.prisma.oTP.delete({
        where: { id: otpRecord.id }
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} otp`;
  }

  remove(id: number) {
    return `This action removes a #${id} otp`;
  }
}
