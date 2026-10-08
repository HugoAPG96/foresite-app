import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BacklogService } from './backlog.service';
import { CreateBacklogItemDto } from './dto/create-backlog-item.dto';

@ApiTags('backlog')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/backlog')
export class BacklogController {
  constructor(private readonly backlogService: BacklogService) {}

  @Get()
  @ApiOperation({ summary: 'Lista los ítems del product backlog' })
  findAll(@Param('projectId') projectId: string) {
    return this.backlogService.findAllByProject(projectId);
  }

  @Post()
  @ApiOperation({ summary: 'Crea un ítem del backlog (Épica, HU, Spike, Bug o Enabler)' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateBacklogItemDto) {
    // El "code" (ej. "HU-002") se autonumera según el tipo en la capa de servicio
    return this.backlogService.create(projectId, 'TBD', dto);
  }
}
