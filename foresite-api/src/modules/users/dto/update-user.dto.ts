import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'Renzo Candia' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
