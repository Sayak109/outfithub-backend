import { IsEnum, IsNumber } from "class-validator";

export enum ListType {
    WISHLIST = "WISHLIST",
    SAVEFORLATER = "SAVEFORLATER",
    RECENTLYVIEWEDPRODUCTS = "RECENTLYVIEWEDPRODUCTS"
}

export class CreateWishlistDto {

    @IsNumber()
    product_id: number

    @IsEnum(ListType)
    list_type: ListType

}
