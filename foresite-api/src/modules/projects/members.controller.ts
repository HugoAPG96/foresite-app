import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { AuthRequest } from '../../common/types/auth-request';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddMemberDto } from './dto/add-member.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
@Controller('projects/:projectId/members')
export class MembersController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista los integrantes del proyecto (solo el dueño o un integrante)' })
  list(@Param('projectId') projectId: string) {
    return this.projectsService.members(projectId);
  }

  @Post()
  @ApiOperation({
    summary: 'Agrega un integrante por correo (solo el Scrum Master). 404 si el correo no está registrado',
  })
  async add(@Param('projectId') projectId: string, @Req() req: AuthRequest, @Body() dto: AddMemberDto) {
    await this.projectsService.assertOwner(projectId, req.user.userId);
    return this.projectsService.addMemberByEmail(projectId, dto.email);
  }
}
