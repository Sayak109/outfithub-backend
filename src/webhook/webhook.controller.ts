import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res, Headers, HttpStatus, BadRequestException } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { Request, Response } from 'express';

@Controller({ path: 'webhook', version: '1' })
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) { }

  @Post("razorpay")
  async razorpayWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-razorpay-signature') razorpaySignature: string
  ) {
    try {
      const rawBody = req.body;
      const webhook = await this.webhookService.razorpayWebhook(rawBody, razorpaySignature);
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Webhook processed successfully' });
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @Get()
  findAll() {
    return this.webhookService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.webhookService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWebhookDto: UpdateWebhookDto) {
    return this.webhookService.update(+id, updateWebhookDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.webhookService.remove(+id);
  }
}
