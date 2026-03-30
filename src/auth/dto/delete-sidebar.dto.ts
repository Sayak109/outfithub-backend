import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class DeleteSidebarDto {
    @IsNumber()
    sidebar_id: number;
}