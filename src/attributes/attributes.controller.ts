import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, UseGuards, Req, Put } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { Request, Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { FindAttributesDto } from './dto/find-attributes.dto';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { PrismaService } from '@/prisma/prisma.service';

@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Operator)
@Controller({ path: 'attributes', version: '1' })
export class AttributesController {
  constructor(private readonly attributesService: AttributesService, private prisma: PrismaService) { }

  @Post()
  async create(@Res() res: Response, @Body() createAttributeDto: CreateAttributeDto,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const attributes = await this.attributesService.create(createAttributeDto);

      let result = JSON.stringify(attributes, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      await this.prisma.adminActivityLog.create({
        data: {
          action: 'CREATE',
          description: `Attribute "${attributes.attribute.name}" created by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Attributes added successfully"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Patch(':id')
  async updateAttribute(@Res() res: Response, @Param('id') id: string,
    @Body() updateAttributeDto: UpdateAttributeDto, @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const attributes = await this.attributesService.updateAttribute(BigInt(id), updateAttributeDto);

      let result = JSON.stringify(attributes, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `Attribute "${attributes.attribute.name}" updated by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Attribute updated successfully"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Patch('term/:id')
  async updateAttributeTerm(@Res() res: Response, @Param('id') id: string,
    @Body() updateAttributeDto: UpdateAttributeDto, @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const attributes = await this.attributesService.updateAttributeTerm(BigInt(id), updateAttributeDto);

      let result = JSON.stringify(attributes, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'UPDATE',
          description: `Attribute Term "${attributes.attributeTerm.name}" updated by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Attribute updated successfully"));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put()
  async findAll(@Res() res: Response, @Body() findAttrDto: FindAttributesDto) {
    try {
      const attributes = await this.attributesService.findAll(findAttrDto);

      let result = JSON.stringify(attributes, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "All Attributes."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Put(':id')
  async findOne(@Res() res: Response, @Param('id') id: string, @Body() findAttrDto: FindAttributesDto) {
    try {
      const attributes = await this.attributesService.findOne(BigInt(id), findAttrDto);

      let result = JSON.stringify(attributes, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Attribute found successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Delete(':id')
  async removeAttribute(@Res() res: Response, @Param('id') id: string,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const attributes = await this.attributesService.removeAttribute(BigInt(id));

      let result = JSON.stringify(attributes, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'DELETE',
          description: `Attribute "${attributes.name}" deleted by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Attribute deleted successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Delete('/term/:id')
  async removeAttributeTerm(@Res() res: Response, @Param('id') id: string,
    @Req() req: Request, @GetUser("email") user_email: string) {
    try {
      const attributeTerms = await this.attributesService.removeAttributeTerm(BigInt(id));

      let result = JSON.stringify(attributeTerms, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      await this.prisma.adminActivityLog.create({
        data: {
          action: 'DELETE',
          description: `Attribute Term "${attributeTerms.name}" deleted by "${user_email}".`,
          ip: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Attribute value deleted successfully."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }
}
