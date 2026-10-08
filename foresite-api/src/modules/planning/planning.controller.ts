import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { PlanningService } from './planning.service';

@ApiTags('planning')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
@Controller('projects/:projectId')
export class PlanningController {
  constructor(private readonly planning: PlanningService) {}

  @Get('phases')
  @ApiOperation({ summary: 'Lista las fases del cronograma' })
  phases(@Param('projectId') projectId: string) {
    return this.planning.listPhases(projectId);
  }

  @Post('phases')
  @ApiOperation({ summary: 'Crea una fase del cronograma (el orden se asigna automáticamente)' })
  createPhase(@Param('projectId') projectId: string, @Body() dto: CreatePhaseDto) {
    return this.planning.createPhase(projectId, dto);
  }

  @Get('sprints')
  @ApiOperation({ summary: 'Lista los sprints' })
  sprints(@Param('projectId') projectId: string) {
    return this.planning.listSprints(projectId);
  }

  @Post('sprints')
  @ApiOperation({ summary: 'Crea un sprint' })
  createSprint(@Param('projectId') projectId: string, @Body() dto: CreateSprintDto) {
    return this.planning.createSprint(projectId, dto);
  }
}
