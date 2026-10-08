import { PartialType } from '@nestjs/swagger';
import { CreateBacklogItemDto } from './create-backlog-item.dto';

export class UpdateBacklogItemDto extends PartialType(CreateBacklogItemDto) {}
