import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, BadRequestException, Res, Put, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/auth/enums/role.enum';
import { RolesGuard } from '@/auth/guard/roles.guard';
import { JwtGuard } from '@/auth/guard/jwt.guard';
import { ApiResponse } from '@/common/dto/response.dto';
import { Request, Response } from 'express';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { GetWalletDto } from './dto/get-wallet.dto';
import { CreateWithdrawRequestDto } from './dto/withdrawal-request.dto';
import { PaginationDto } from '@/customer/product/dto/pagination.dto';
import { GetLivesDto } from '@/live/dto/get-lives.dto';
import ExcelJS = require("exceljs");
import * as path from 'path';
import * as fs from 'fs';

@UseGuards(JwtGuard)
@Controller({ path: 'wallet', version: '1' })
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Post()
  create(@Body() createWalletDto: CreateWalletDto) {
    return this.walletService.create(createWalletDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Seller)
  @Get("seller")
  async sellerWallet(@Res() res: Response, @GetUser("id") user_id: string) {
    try {
      const wallet = await this.walletService.sellerWallet(BigInt(user_id));

      let result = JSON.stringify(wallet, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Seller wallet."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Seller)
  @Put("seller/transactions")
  async sellerWalletTransactions(@Res() res: Response, @GetUser("id") user_id: string, @Body() dto: GetLivesDto) {
    try {
      const wallet = await this.walletService.sellerWalletTransactions(BigInt(user_id), dto);

      let result = JSON.stringify(wallet, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Seller wallet transactions."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Seller)
  @Post("withdraw-request")
  async sellerWalletWithdrawalRequest(@Res() res: Response, @GetUser("id") user_id: string, @Body() dto: CreateWithdrawRequestDto) {
    try {
      const wallet = await this.walletService.sellerWalletWithdrawalRequest(BigInt(user_id), dto);

      let result = JSON.stringify(wallet, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Seller wallet withdrawal request."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Seller)
  @Put("seller/withdraw-request")
  async sellerWithdrawalRequests(@Res() res: Response, @GetUser("id") user_id: string, @Body() dto: GetLivesDto) {
    try {
      const wallet = await this.walletService.sellerWithdrawalRequests(BigInt(user_id), dto);

      let result = JSON.stringify(wallet, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Seller wallet withdrawal request."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }
  ///////////////////// Admin wallet work //////////////////
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Put("admin")
  async adminWallet(@Res() res: Response, @GetUser("id") user_id: string, @Body() dto: GetWalletDto) {
    try {
      const wallet = await this.walletService.adminWallet(BigInt(user_id), dto);

      let result = JSON.stringify(wallet, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Admin wallet."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Put("withdraw-request")
  async withdrawalRequestList(@Res() res: Response, @Body() dto: PaginationDto) {
    try {
      const wallet = await this.walletService.withdrawalRequestList(dto);

      let result = JSON.stringify(wallet, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Wallet withdraw request list."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  formatDate(isoString?: string) {
    if (!isoString) return "--";
    const date = new Date(isoString);
    const formatDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return formatDate
  }


  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Get("request/export")
  async exportWithdrawalRequest(@Res() res: Response, @Body() dto: PaginationDto) {
    try {
      const wallet = await this.walletService.exportWithdrawalRequest(dto);
      const payoutManagementCSVreport = JSON.parse(wallet.List)
      console.log(payoutManagementCSVreport);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("payoutManagementCSVreport");
      worksheet.columns = [
        { header: "Seller", key: "seller", width: 30 },
        { header: "Business Name", key: "business_name", width: 30 },
        { header: "Amount", key: "amount", width: 15 },
        { header: "Requested Date", key: "created_at", width: 25 },
        { header: "Paid Date", key: "paid_at", width: 25 },
        { header: "Status", key: "status", width: 25 },
      ];

      payoutManagementCSVreport.forEach((item: any) => {
        worksheet.addRow({
          seller: `${item?.seller?.first_name || item?.seller?.last_name
            ? `${item?.seller?.first_name || ''} ${item?.seller?.last_name || ''}`.trim()
            : '--'}`,
          business_name: item?.seller?.sellerProfile?.business_name || '--',
          amount: item.amount || 0,
          created_at: this.formatDate(item.created_at),
          paid_at: this.formatDate(item.paid_at) || "--",
          status: item.payout_status?.title
            ? item.payout_status.title.charAt(0).toUpperCase() + item.payout_status.title.slice(1)
            : ''
        });
      });
      const targetDir = path.join(
        process.env.IMAGE_PATH!,
        process.env.WALLET_REPORT_PATH!,
      );
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
      const fileName = `payout_management_${timestamp}.xlsx`;
      const filePath = path.join(targetDir, fileName);
      const downloadLink = `${process.env.BASE_PATH}/${process.env.IMAGE_PATH}/${process.env.WALLET_REPORT_PATH}/${fileName}`
      await workbook.xlsx.writeFile(filePath);
      return res.status(HttpStatus.OK).json(new ApiResponse({ downloadLink, fileName }, "Download wallet withdraw request list."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }


  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Patch("withdraw-request/:id")
  async approveWithdrawalRequest(
    @Res() res: Response, @Param("id") request_id: string, @Body() body: any,
    @Req() req: Request, @GetUser("email") user_email: string
  ) {
    try {
      const wallet = await this.walletService.approveWithdrawalRequest(BigInt(request_id), BigInt(body.status_id), req, user_email);

      let result = JSON.stringify(wallet, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Update seller wallet withdraw request."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.walletService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWalletDto: UpdateWalletDto) {
    return this.walletService.update(+id, updateWalletDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.walletService.remove(+id);
  }
}
