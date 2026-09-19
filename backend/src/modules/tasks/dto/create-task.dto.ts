import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty()
  @IsUUID()
  phaseId: string;

  @ApiProperty({ required: false, description: 'Ítem del backlog que origina esta tarea' })
  @IsOptional()
  @IsUUID()
  backlogItemId?: string;

  @ApiProperty({ example: 'Configurar entorno y repositorio' })
  @IsString()
  title: string;

  @ApiProperty()
  @IsUUID()
  responsibleId: string;

  @ApiProperty()
  @IsUUID()
  accountableId: string;

  @ApiProperty({ example: '2026-09-28' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-09-29' })
  @IsDateString()
  endDate: string;
}
