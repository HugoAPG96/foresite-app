import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

/**
 * Corresponde al Paso 1 del wizard de onboarding: Acta de constitución.
 */
export class CreateProjectDto {
  @ApiProperty({ example: 'ReparaYa' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiProperty({ example: '2026-09-14' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-10-26' })
  @IsDateString()
  endDate: string;
}
