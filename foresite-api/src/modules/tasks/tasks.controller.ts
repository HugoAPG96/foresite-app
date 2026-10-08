import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Lista las tareas del cronograma (vistas Kanban y Cronograma)' })
  findAll(@Param('projectId') projectId: string) {
    return this.tasksService.findAllByProject(projectId);
  }

  @Post()
  @ApiOperation({ summary: 'Crea una tarea del cronograma RACI (el código "fase.n" se autonumera)' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(projectId, dto);
  }

  @Patch(':taskId')
  @ApiOperation({ summary: 'Edita una tarea (estado, % de avance, RACI, fechas…)' })
  update(@Param('projectId') projectId: string, @Param('taskId') taskId: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(projectId, taskId, dto);
  }

  @Delete(':taskId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Elimina una tarea' })
  remove(@Param('projectId') projectId: string, @Param('taskId') taskId: string) {
    return this.tasksService.remove(projectId, taskId);
  }
}
