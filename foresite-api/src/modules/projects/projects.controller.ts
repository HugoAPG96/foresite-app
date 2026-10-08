import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../common/types/auth-request';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('projects')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista los proyectos del usuario (creados por él o donde es integrante)' })
  findAll(@Req() req: AuthRequest) {
    return this.projectsService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un proyecto (solo el dueño o un integrante)' })
  async findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    await this.projectsService.assertAccess(id, req.user.userId);
    return this.projectsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crea un proyecto (Paso 1 del wizard: Acta de constitución) con sus integrantes' })
  create(@Body() dto: CreateProjectDto, @Req() req: AuthRequest) {
    return this.projectsService.create(dto, req.user.userId);
  }
}
