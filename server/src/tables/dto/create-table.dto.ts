import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateTableDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(9)
  maxSeats?: number;

  @IsNumber()
  @Min(1)
  smallBlind: number;

  @IsNumber()
  @Min(1)
  bigBlind: number;

  @IsNumber()
  @Min(1)
  minBuyIn: number;

  @IsNumber()
  @Min(1)
  maxBuyIn: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  rakePercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rakeCap?: number;

  @IsOptional()
  @IsIn(['active', 'paused'])
  status?: 'active' | 'paused';
}
