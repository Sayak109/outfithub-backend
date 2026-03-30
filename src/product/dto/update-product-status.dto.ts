import { IsNumber, IsOptional } from "class-validator"


export class UpdateProductStatusDto {

    @IsNumber()
    @IsOptional()
    status_id: number

    @IsNumber()
    @IsOptional()
    approval_status_id: number

}
