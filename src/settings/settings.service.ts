import { Injectable } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { decryptData, encryptData } from '@/common/helper/common.helper';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }
  create(createSettingDto: CreateSettingDto) {
    return 'This action adds a new setting';
  }

  findAll() {
    return `This action returns all settings`;
  }

  async paymentSettings() {
    try {
      const payment_settings = await this.prisma.adminSettings.findFirst({
        where: {
          title: "payment-settings",
        }
      })
      const {
        razorpayid,
        razorpaysecretkey
      } = payment_settings?.metadata as Record<string, any> || {};
      const setting = {
        RAZORPAY_KEY_ID: razorpayid,
        RAZORPAY_KEY_SECRET: razorpaysecretkey
      }
      const encryptedRes = encryptData(setting)
      const decryptedRes = decryptData(encryptedRes)
      return encryptedRes
    } catch (error) {
      throw error
    }
  }

  update(id: number, updateSettingDto: UpdateSettingDto) {
    return `This action updates a #${id} setting`;
  }

  remove(id: number) {
    return `This action removes a #${id} setting`;
  }
}
