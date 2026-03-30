import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator"



class ProductAttributeInput {
    @IsNumber()
    id: number;

    @IsArray()
    @ArrayNotEmpty()
    @IsNumber({}, { each: true })
    values: number[];
}

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsOptional()
    @IsNumber()
    seller_id: number

    @IsOptional()
    @IsNumber()
    status_id: number

    @IsString()
    @IsOptional()
    desc: string

    @IsString()
    @IsOptional()
    @IsNotEmpty()
    sku: string

    @IsNumber()
    @IsNotEmpty()
    mrp: number

    @IsNumber()
    @IsOptional()
    sales_price: number

    @IsNumber()
    shipping: number

    @IsNumber()
    tax: number

    @IsOptional()
    @IsNumber()
    stock_quantity: number

    @IsBoolean()
    new_collection: boolean

    @IsBoolean()
    out_of_stock: boolean

    @IsOptional()
    @IsArray()
    category_ids: number[]

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductAttributeInput)
    attribute: ProductAttributeInput[];

    @IsString()
    @IsOptional()
    meta_title: string
    @IsString()
    @IsOptional()
    meta_description: string
    @IsString()
    @IsOptional()
    meta_keyword: string
    @IsString()
    @IsOptional()
    other_meta: string
}
