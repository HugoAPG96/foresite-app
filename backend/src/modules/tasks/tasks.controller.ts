import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ProjectsService } from '../projects/projects.service';

@ApiTags('tasks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista las tareas del cronograma (vista Kanban o Cronograma)' })
  async findAll(@Param('projectId') projectId: string, @Req() req: any) {
    await this.projectsService.assertAccess(projectId, req.user.userId);
    return this.tasksService.findAllByProject(projectId);
  }

  @Post()
  @ApiOperation({ summary: 'Crea una tarea del cronograma' })
  async create(@Param('projectId') projectId: string, @Body() dto: CreateTaskDto, @Req() req: any) {
    await this.projectsService.assertAccess(projectId, req.user.userId);
    return this.tasksService.create(projectId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita una tarea (título, responsable, fechas, prioridad, estado)' })
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: any,
  ) {
    await this.projectsService.assertAccess(projectId, req.user.userId);
    return this.tasksService.update(projectId, id, dto);
  }
}
