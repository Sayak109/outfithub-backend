import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateFaqModuleDto {

    @IsOptional()
    @IsString()
    name: string

    @IsOptional()
    @IsString()
    desc: string

    @IsNumber()
    @IsOptional()
    rank: number

    @IsNumber()
    @IsOptional()
    status_id: number

}
