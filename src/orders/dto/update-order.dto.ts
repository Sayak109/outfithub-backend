import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsNumber } from 'class-validator';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
    @IsNumber()
    order_status_id: number
}
