import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'username deve conter apenas letras, números e _' })
  username: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  displayName: string;

  @IsString()
  @MinLength(6)
  @MaxLength(60)
  password: string;

  @IsOptional()
  @IsIn(['admin', 'manager', 'player'])
  role?: 'admin' | 'manager' | 'player';
}
