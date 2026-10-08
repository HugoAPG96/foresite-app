import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'miguel@upn.edu.pe' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'contraseñaSegura123' })
  @IsString()
  @MinLength(6)
  password: string;
}
