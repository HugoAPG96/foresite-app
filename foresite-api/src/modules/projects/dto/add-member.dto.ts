import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ example: 'N00345390@upn.pe', description: 'Correo de un usuario ya registrado' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Ingresa un correo válido' })
  email: string;
}
