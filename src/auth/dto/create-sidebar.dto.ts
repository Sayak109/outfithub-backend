import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class CreateSidebarDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsOptional()
    @IsNumber()
    parent_id?: number

    @IsOptional()
    @IsString()
    web_icon?: string

    @IsOptional()
    @IsString()
    web_link?: string

    @IsOptional()
    @IsString()
    app_link?: string

    @IsOptional()
    @IsString()
    admin_link?: string
}