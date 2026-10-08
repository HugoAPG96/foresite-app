import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { Phase } from './entities/phase.entity';
import { Sprint } from './entities/sprint.entity';

@Injectable()
export class PlanningService {
  constructor(
    @InjectRepository(Phase) private readonly phases: Repository<Phase>,
    @InjectRepository(Sprint) private readonly sprints: Repository<Sprint>,
  ) {}

  listPhases(projectId: string) {
    return this.phases.find({ where: { projectId }, order: { orderIndex: 'ASC' } });
  }

  async createPhase(projectId: string, dto: CreatePhaseDto) {
    const rows = await this.phases.find({ where: { projectId }, select: { orderIndex: true } });
    const orderIndex = rows.reduce((max, p) => Math.max(max, p.orderIndex), -1) + 1;
    return this.phases.save(this.phases.create({ projectId, name: dto.name.trim(), orderIndex }));
  }

  listSprints(projectId: string) {
    return this.sprints.find({ where: { projectId }, order: { number: 'ASC' } });
  }

  async createSprint(projectId: string, dto: CreateSprintDto) {
    if (dto.endDate < dto.startDate) throw new BadRequestException('La fecha de fin no puede ser anterior al inicio');
    const dup = await this.sprints.findOne({ where: { projectId, number: dto.number } });
    if (dup) throw new ConflictException(`El Sprint ${dto.number} ya existe en este proyecto`);
    return this.sprints.save(this.sprints.create({ projectId, ...dto }));
  }
}
