import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Miguel Torres' })
  @IsNotEmpty({message: 'Name is required'})
  @IsString({message: 'Name must be a valid string'})
  name: string;

  @ApiProperty({ example: 'miguel@upn.edu.pe' })
  @IsNotEmpty({message: 'Email is required'})
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'contraseñaSegura123', minLength: 6 })
  @IsNotEmpty({message: 'Password is required'})
  @IsString({message: 'Password must be a valid string'})
  @MinLength(6 ,{message: 'Password must be as min 6 characters'})
  password: string;
}
