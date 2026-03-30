import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { hashPassword } from 'src/common/utils/common';
import { EditUserDto } from './dto/edit-user.dto';
import { MailService } from 'src/mail/mail.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { FindUserDto } from './dto/find-user.dto';
import { ApiResponse } from '@/common/dto/response.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService, private readonly mailService: MailService) { }

  async edit(userId: number, dto: EditUserDto, file) {
    try {
      const imageFileName = file?.filename ?? "";
      let dataToUpdate: any = {
        first_name: dto?.first_name,
        last_name: dto?.last_name,
        phone_no: dto?.phone_no
      };

      if (dto?.delete) {
        dataToUpdate.image = null;
      } else if (imageFileName !== "") {
        dataToUpdate.image = `${imageFileName}`;
      }

      const res = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: dataToUpdate,
      });

      const { password, ...user } = res;
      return user;
    } catch (error) {
      throw error
    }
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    try {
      let user = await this.prisma.user.findUnique({
        where: {
          id: userId
        }
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      let userPassword = user.password ?? "";

      const isMatch = await bcrypt.compare(dto.old_password, userPassword);
      if (!isMatch) {
        throw new BadRequestException('Old password is incorrect');
      }

      const hashedNewPassword = await bcrypt.hash(dto.new_password, 10);
      user.password = hashedNewPassword;

      await this.prisma.user.update({
        where: {
          id: userId
        },
        data: {
          password: hashedNewPassword
        }
      });

      return true;
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error?.message);
    }
  }

  async checkUser(findUser: FindUserDto) {
    try {
      const user =
        await this.prisma.user.findFirst({
          where: {
            email: {
              equals: findUser.email,
              mode: 'insensitive',
            },
          },
        });

      if (user?.account_status_id === BigInt(2)) {
        throw new BadRequestException('Sorry, your account is Suspended.');

      }

      if (user?.account_status_id === BigInt(3)) {
        throw new BadRequestException('Sorry, your account is Deactivated.');
      }
      if (user) {
        // throw new BadRequestException(`Email already exists. Please login using ${user.provider === "EMAIL" ? "Email and Password" : user.provider === "GOOGLE" ? "'Continue with Google'" : "'Continue with Apple'"}`);
        const data = {
          exits: true,
          provider: user.provider
        }
        return data
      } else {
        const data = {
          exits: false,
          provider: null
        }
        return data
      }


    } catch (error) {
      throw error
    }
  }

}
