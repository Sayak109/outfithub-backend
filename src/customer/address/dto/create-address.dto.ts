import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsObject, IsOptional } from "class-validator";

export enum AddressType {
    BILLING = 'BILLING',
    SHIPPING = 'SHIPPING',
}


export class CreateAddressDto {

    @IsObject()
    @Type(() => Object)
    metadata: Record<string, string>;

    @IsEnum(AddressType)
    address_type: AddressType;


    @IsOptional()
    @IsBoolean()
    default: boolean

}
