import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString } from "class-validator"

export class CreateFeedbackDto {

    @IsString()
    ratings: string

    @IsString()
    @IsOptional()
    description: string

    @IsString()
    product_id: string

    @Transform(({ value }) => {
        if (typeof value === 'boolean') return value;
        return String(value).toLowerCase() === 'true';
    })
    @IsNotEmpty()
    anonymous: boolean;
}
