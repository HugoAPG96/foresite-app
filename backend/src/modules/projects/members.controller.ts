import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MembersService } from './members.service';
import { ProjectsService } from './projects.service';
import { AddMemberDto } from './dto/add-member.dto';

@ApiTags('project-members')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/members')
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista los miembros de un proyecto' })
  async findAll(@Param('projectId') projectId: string, @Req() req: any) {
    await this.projectsService.assertAccess(projectId, req.user.userId);
    return this.membersService.list(projectId);
  }

  @Post()
  @ApiOperation({ summary: 'Agrega un usuario ya registrado como miembro (solo el creador)' })
  async create(@Param('projectId') projectId: string, @Body() dto: AddMemberDto, @Req() req: any) {
    await this.projectsService.assertOwner(projectId, req.user.userId);
    return this.membersService.addByEmail(projectId, dto.email);
  }
}
