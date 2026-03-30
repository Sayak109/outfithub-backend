import { IsDateString, IsOptional } from 'class-validator';

export class GetWalletDto {
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;
}
