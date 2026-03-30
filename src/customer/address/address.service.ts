import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AddressService {
  constructor(
    private prisma: PrismaService,
  ) { }

  async createAddress(user_id: bigint, createAddressDto: CreateAddressDto) {
    try {
      const { address_type, metadata } = createAddressDto;

      if (address_type === 'BILLING') {
        const existingBilling = await this.prisma.address.findFirst({
          where: {
            user_id: user_id,
            address_type: address_type,
          }
        });

        if (existingBilling) {
          return await this.prisma.address.update({
            where: { id: existingBilling.id },
            data: {
              metadata: JSON.stringify(metadata)
            }
          });
        } else {
          return await this.prisma.address.create({
            data: {
              user_id: user_id,
              address_type: address_type,
              metadata: JSON.stringify(metadata),
              default: createAddressDto.default
            }
          });
        }
      } else {
        if (address_type === 'SHIPPING') {
          if (createAddressDto.default === true) {
            await this.prisma.address.updateMany({
              where: {
                user_id,
                address_type: 'SHIPPING'
              },
              data: { default: false }
            });
          }
        }

        return await this.prisma.address.create({
          data: {
            user_id: user_id,
            address_type: address_type,
            metadata: JSON.stringify(metadata),
            default: createAddressDto.default
          }
        });
      }
    } catch (error) {
      throw error;
    }
  }


  async findAll(user_id: bigint) {
    try {
      const address = await this.prisma.address.findMany({
        where: { user_id },
        select: {
          id: true,
          address_type: true,
          metadata: true,
          default: true,
          created_at: true,
          updated_at: true,
        }
      });
      if (!address) return [];

      const addresses = address.map(adres => ({
        ...adres,
        metadata: JSON.parse(adres.metadata)
      }));

      return addresses;
    } catch (error) {
      throw error
    }
  }


  async findOne(id: bigint, user_id: bigint) {
    try {
      const address = await this.prisma.address.findUnique({
        where: { id, user_id },
        select: {
          id: true,
          address_type: true,
          metadata: true,
          default: true,
          created_at: true,
          updated_at: true,
        }
      });

      if (!address) return [];

      return {
        ...address,
        metadata: JSON.parse(address.metadata)
      };
    } catch (error) {
      throw error;
    }
  }

  async update(id: bigint, user_id: bigint, updateAddressDto: UpdateAddressDto) {
    try {
      const type = await this.prisma.address.findUnique({
        where: {
          id
        }
      })

      if (updateAddressDto.default === true) {
        await this.prisma.address.updateMany({
          where: {
            user_id,
            address_type: type?.address_type,
            NOT: { id }
          },
          data: { default: false }
        });
      }
      const address = await this.prisma.address.update({
        where: { id, user_id },
        data: {
          metadata: JSON.stringify(updateAddressDto.metadata),
          default: updateAddressDto.default
        }
      });
      return address;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: bigint, user_id: bigint,) {
    try {
      const address = await this.prisma.address.findUnique({ where: { id, user_id } });
      if (!address) throw new BadRequestException("Address not found.")
      if (address?.address_type === "SHIPPING") {
        const delAddress = await this.prisma.address.delete({ where: { id, user_id } });
        return delAddress
      } else {
        throw new BadRequestException("You cannot delete billing address.")
      }
    } catch (error) {
      throw error;
    }
  }
}
