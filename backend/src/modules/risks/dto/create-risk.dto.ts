import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { RiskLevel } from '../entities/risk.entity';

export class CreateRiskDto {
  @ApiProperty({ example: 'Retraso en la API externa de la municipalidad' })
  @IsString()
  description: string;

  @ApiProperty({ enum: RiskLevel })
  @IsEnum(RiskLevel)
  probability: RiskLevel;

  @ApiProperty({ enum: RiskLevel })
  @IsEnum(RiskLevel)
  impact: RiskLevel;

  @ApiProperty({ example: 'Usar datos simulados mientras se confirma acceso' })
  @IsString()
  mitigation: string;

  @ApiProperty()
  @IsUUID()
  ownerId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  linkedTaskId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  linkedBacklogItemId?: string;
}
