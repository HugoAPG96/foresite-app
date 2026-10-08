import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TaskPriority } from '../entities/task.entity';

export class CreateTaskDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  phaseId?: string;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  accountableId?: string;

  @ApiProperty({ required: false, enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({ example: '2026-09-28' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-09-29' })
  @IsDateString()
  endDate: string;
}
