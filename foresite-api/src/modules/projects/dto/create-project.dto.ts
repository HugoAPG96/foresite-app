import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Corresponde al Paso 1 del wizard de onboarding: Acta de constitución.
 */
export class CreateProjectDto {
  @ApiProperty({ example: 'Foresite' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiProperty({ example: '2026-09-07' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-10-09' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ required: false, type: [String], description: 'Ids de los integrantes (el creador se agrega solo)' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds?: string[];
}
