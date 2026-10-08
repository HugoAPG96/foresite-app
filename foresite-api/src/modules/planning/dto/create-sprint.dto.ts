import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, Min } from 'class-validator';

export class CreateSprintDto {
  @ApiProperty({ example: 1, description: 'N° de sprint (0 = Sprint 0 de planificación)' })
  @IsInt()
  @Min(0)
  number: number;

  @ApiProperty({ example: '2026-09-14' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-09-25' })
  @IsDateString()
  endDate: string;
}
