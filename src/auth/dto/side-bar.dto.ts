import { IsBoolean, IsNotEmpty } from "class-validator"

export class SideBarDto {
    @IsNotEmpty()
    @IsBoolean()
    is_app: boolean
}