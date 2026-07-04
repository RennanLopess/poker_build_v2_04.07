import { IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ChipOperationDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsIn(['add', 'remove', 'set'])
  operation: 'add' | 'remove' | 'set';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
