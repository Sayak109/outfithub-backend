import { IsNotEmpty, IsNumber, IsArray, ArrayNotEmpty, IsOptional } from "class-validator";

export class CreateCartDto {
    @IsNumber()
    @IsNotEmpty()
    product_id: number;

    @IsArray()
    @ArrayNotEmpty()
    @IsNumber({}, { each: true })
    attribute_term_ids: number[];

    @IsNumber()
    @IsNotEmpty()
    quantity: number;
}
