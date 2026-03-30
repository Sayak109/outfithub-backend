import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, HttpStatus, BadRequestException } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';

@UseGuards(JwtGuard)
@Controller({ path: 'customer/address', version: '1' })
export class AddressController {
  constructor(private readonly addressService: AddressService) { }

  @Post()
  async createBillingAddress(@Res() res: Response, @GetUser("id") user_id: string, @Body() createAddressDto: CreateAddressDto) {
    try {
      const address = await this.addressService.createAddress(BigInt(user_id), createAddressDto);
      let result = JSON.stringify(address, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Address created successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get()
  async findAll(@Res() res: Response, @GetUser("id") user_id: string,) {
    try {
      const address = await this.addressService.findAll(BigInt(user_id));
      let result = JSON.stringify(address, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Customer addressess."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @Get(':id')
  async findOne(@Res() res: Response, @Param('id') id: string, @GetUser("id") user_id: string) {
    try {
      const address = await this.addressService.findOne(BigInt(id), BigInt(user_id));
      let result = JSON.stringify(address, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Customer addresse."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @Patch(':id')
  async update(@Res() res: Response, @Param('id') id: string,
    @GetUser("id") user_id: string, @Body() updateAddressDto: UpdateAddressDto) {
    try {
      const address = await this.addressService.update(BigInt(id), BigInt(user_id), updateAddressDto);
      let result = JSON.stringify(address, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Address updated successfully."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') id: string, @GetUser("id") user_id: string) {
    try {
      const address = await this.addressService.remove(BigInt(id), BigInt(user_id));
      let result = JSON.stringify(address, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Address deleted successfully."));
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }
}
