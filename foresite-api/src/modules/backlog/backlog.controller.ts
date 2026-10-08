import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { BacklogService } from './backlog.service';
import { CreateBacklogItemDto } from './dto/create-backlog-item.dto';
import { UpdateBacklogItemDto } from './dto/update-backlog-item.dto';

@ApiTags('backlog')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
@Controller('projects/:projectId/backlog')
export class BacklogController {
  constructor(private readonly backlogService: BacklogService) {}

  @Get()
  @ApiOperation({ summary: 'Lista los ítems del product backlog (incluye responsableIds)' })
  findAll(@Param('projectId') projectId: string) {
    return this.backlogService.findAllByProject(projectId);
  }

  @Post()
  @ApiOperation({ summary: 'Crea un ítem (EP, HU, SP, EN, TA, RN, DO o BU); el código "HU-001" se autonumera' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateBacklogItemDto) {
    return this.backlogService.create(projectId, dto);
  }

  @Patch(':itemId')
  @ApiOperation({ summary: 'Edita un ítem del backlog (status, sprint, responsables…)' })
  update(@Param('projectId') projectId: string, @Param('itemId') itemId: string, @Body() dto: UpdateBacklogItemDto) {
    return this.backlogService.update(projectId, itemId, dto);
  }

  @Delete(':itemId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Elimina un ítem; sus tareas del cronograma se conservan' })
  remove(@Param('projectId') projectId: string, @Param('itemId') itemId: string) {
    return this.backlogService.remove(projectId, itemId);
  }
}
