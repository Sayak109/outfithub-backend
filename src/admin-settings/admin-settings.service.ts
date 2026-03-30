import { Injectable } from '@nestjs/common';
import { CreateAdminSettingDto } from './dto/create-admin-setting.dto';
import { UpdateAdminSettingDto } from './dto/update-admin-setting.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { decryptData, encryptData } from '@/common/helper/common.helper';

@Injectable()
export class AdminSettingsService {
  constructor(
    private prisma: PrismaService,
  ) { }
  async create(createAdminSettingDto: CreateAdminSettingDto) {
    const decryptedPayload = decryptData(createAdminSettingDto?.data)
    try {
      const setting = await this.prisma.adminSettings.create({
        data: {
          title: decryptedPayload.title,
          metadata: decryptedPayload.metadata
        }
      })
      return setting
    } catch (error) {
      throw new Error(`Failed to create admin settings: ${error.message}`);
    }
  }

  async findAll() {
    try {
      const setting = await this.prisma.adminSettings.findMany({
        select: {
          id: true,
          title: true,
          metadata: true,
          created_at: true,
          updated_at: true
        }
      })
      const encryptedRes = encryptData(setting)
      return encryptedRes
    } catch (error) {
      throw new Error(`Failed to get admin settings: ${error.message}`);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} adminSetting`;
  }

  async update(setting_id: bigint, updateAdminSettingDto: UpdateAdminSettingDto) {
    const decryptedPayload = decryptData(updateAdminSettingDto?.data)
    try {
      const setting = await this.prisma.adminSettings.update({
        where: {
          id: setting_id
        },
        data: {
          title: decryptedPayload.title,
          metadata: decryptedPayload.metadata
        }
      })
      return setting
    } catch (error) {
      throw new Error(`Failed to update admin settings: ${error.message}`);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} adminSetting`;
  }
}
