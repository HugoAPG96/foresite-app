import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RisksService } from './risks.service';
import { CreateRiskDto } from './dto/create-risk.dto';

@ApiTags('risks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/risks')
export class RisksController {
  constructor(private readonly risksService: RisksService) {}

  @Get()
  @ApiOperation({ summary: 'Lista los riesgos del proyecto (para la matriz y el listado)' })
  findAll(@Param('projectId') projectId: string) {
    return this.risksService.findAllByProject(projectId);
  }

  @Post()
  @ApiOperation({ summary: 'Registra un riesgo; la severidad se calcula automáticamente' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateRiskDto) {
    return this.risksService.create(projectId, dto);
  }
}
