import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';

@ApiTags('tasks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Lista las tareas del cronograma (vista Kanban o Cronograma)' })
  findAll(@Param('projectId') projectId: string) {
    return this.tasksService.findAllByProject(projectId);
  }

  @Post()
  @ApiOperation({ summary: 'Crea una tarea del cronograma RACI' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateTaskDto) {
    // El "code" (ej. "3.2") se autonumera según la fase en la capa de servicio
    // cuando se conecte con PhasesService; se deja como placeholder aquí.
    return this.tasksService.create(projectId, 'TBD', dto);
  }
}
