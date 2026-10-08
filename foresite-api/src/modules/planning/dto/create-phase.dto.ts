import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePhaseDto {
  @ApiProperty({ example: 'Desarrollo backend' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;
}
