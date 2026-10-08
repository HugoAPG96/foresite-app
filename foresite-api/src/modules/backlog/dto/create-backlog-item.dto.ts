import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsIn, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { BacklogItemPriority, BacklogItemStatus, BacklogItemType } from '../entities/backlog-item.entity';

/** Escala Fibonacci del proyecto (0 = sin estimar). */
export const FIBONACCI_POINTS = [0, 1, 2, 3, 5, 8, 13, 21];

export class CreateBacklogItemDto {
  @ApiProperty({ enum: BacklogItemType })
  @IsEnum(BacklogItemType)
  type: BacklogItemType;

  @ApiProperty({ example: 'Registro e inicio de sesión' })
  @IsString()
  @MaxLength(160)
  title: string;

  @ApiProperty({ required: false, description: 'HU: "Como…, quiero…, para…". Resto: descripción puntual.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: 'HU: "Dado que…, cuando…, entonces…". Resto: checklist.' })
  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;

  @ApiProperty({ enum: BacklogItemPriority })
  @IsEnum(BacklogItemPriority)
  priority: BacklogItemPriority;

  @ApiProperty({ required: false, enum: FIBONACCI_POINTS })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @IsIn(FIBONACCI_POINTS)
  estimation?: number;

  @ApiProperty({ required: false, enum: BacklogItemStatus })
  @IsOptional()
  @IsEnum(BacklogItemStatus)
  status?: BacklogItemStatus;

  @ApiProperty({ type: [String], description: 'Responsables (puede haber más de uno)' })
  @IsArray()
  @IsUUID('4', { each: true })
  responsableIds: string[];

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  sprintId?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  phaseId?: string | null;

  @ApiProperty({ required: false, nullable: true, example: '2026-09-14' })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiProperty({ required: false, nullable: true, example: '2026-09-18' })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'Id de otro ítem del backlog del que depende' })
  @IsOptional()
  @IsUUID()
  dependencyId?: string | null;
}
