import { IsString } from "class-validator"

export class CreateSellerAggrementDto {

    @IsString()
    title: string

    @IsString()
    desc: string
}
