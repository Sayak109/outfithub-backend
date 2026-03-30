import { IsNumber, IsString } from "class-validator";

export class CreateMenuDto {

    @IsNumber()
    menu_type_id: number

    @IsNumber()
    menu_item_id: number

    @IsString()
    menu_item_type: string

    @IsString()
    path: string

}
