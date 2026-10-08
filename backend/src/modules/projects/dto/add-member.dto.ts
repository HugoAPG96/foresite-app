import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ example: 'usuario@correo.com' })
  @IsEmail()
  email: string;
}
