import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class SidebarIconDto {
    @IsString()
    sidebar_id: string;

    // @IsString()
    // @IsNotEmpty()
    // icon_image: string
}