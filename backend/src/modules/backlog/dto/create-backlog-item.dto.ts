import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BacklogItemPriority, BacklogItemType } from '../entities/backlog-item.entity';

export class CreateBacklogItemDto {
  @ApiProperty({ enum: BacklogItemType })
  @IsEnum(BacklogItemType)
  type: BacklogItemType;

  @ApiProperty({ example: 'Como ciudadano quiero reportar un bache' })
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;

  @ApiProperty({ enum: BacklogItemPriority })
  @IsEnum(BacklogItemPriority)
  priority: BacklogItemPriority;

  @ApiProperty({
    type: [String],
    description: 'IDs de los usuarios responsables (múltiples permitidos)',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  responsableIds: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  phaseId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  dependencyId?: string;
}
