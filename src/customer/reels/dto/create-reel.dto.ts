import { IsNumber } from "class-validator";

export class CreateReelDto {

    @IsNumber()
    product_id: number

}
