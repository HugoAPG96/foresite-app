import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty()
  @IsUUID()
  phaseId: string;

  @ApiProperty({ required: false, nullable: true, description: 'Ítem del backlog que origina esta tarea' })
  @IsOptional()
  @IsUUID()
  backlogItemId?: string | null;

  @ApiProperty({ example: 'Configurar entorno y repositorio' })
  @IsString()
  @MaxLength(160)
  title: string;

  @ApiProperty({ description: 'Responsable (R)' })
  @IsUUID()
  responsibleId: string;

  @ApiProperty({ description: 'A cargo / aprueba (A)' })
  @IsUUID()
  accountableId: string;

  @ApiProperty({ required: false, type: [String], description: 'Consultados (C)' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  consultedIds?: string[];

  @ApiProperty({ required: false, type: [String], description: 'Informados (I)' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  informedIds?: string[];

  @ApiProperty({ example: '2026-09-28' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-09-29' })
  @IsDateString()
  endDate: string;
}
