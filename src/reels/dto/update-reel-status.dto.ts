import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator"

export class updateStatusDto {

    @IsNumber()
    approval_status_id: number
}
