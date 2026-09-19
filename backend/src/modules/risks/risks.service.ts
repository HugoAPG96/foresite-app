import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Risk, RiskLevel, RiskStatus } from './entities/risk.entity';
import { CreateRiskDto } from './dto/create-risk.dto';

const SEVERITY_MATRIX: Record<RiskLevel, Record<RiskLevel, RiskLevel>> = {
  [RiskLevel.ALTO]: {
    [RiskLevel.ALTO]: RiskLevel.ALTO,
    [RiskLevel.MEDIO]: RiskLevel.ALTO,
    [RiskLevel.BAJO]: RiskLevel.MEDIO,
  },
  [RiskLevel.MEDIO]: {
    [RiskLevel.ALTO]: RiskLevel.ALTO,
    [RiskLevel.MEDIO]: RiskLevel.MEDIO,
    [RiskLevel.BAJO]: RiskLevel.BAJO,
  },
  [RiskLevel.BAJO]: {
    [RiskLevel.ALTO]: RiskLevel.MEDIO,
    [RiskLevel.MEDIO]: RiskLevel.BAJO,
    [RiskLevel.BAJO]: RiskLevel.BAJO,
  },
};

@Injectable()
export class RisksService {
  constructor(
    @InjectRepository(Risk)
    private readonly risksRepository: Repository<Risk>,
  ) {}

  findAllByProject(projectId: string) {
    return this.risksRepository.find({ where: { projectId } });
  }

  create(projectId: string, dto: CreateRiskDto) {
    const severity = SEVERITY_MATRIX[dto.probability][dto.impact];
    const risk = this.risksRepository.create({
      ...dto,
      projectId,
      severity,
      status: RiskStatus.ACTIVO,
      linkedTaskId: dto.linkedTaskId ?? null,
      linkedBacklogItemId: dto.linkedBacklogItemId ?? null,
    });
    return this.risksRepository.save(risk);
  }

  /** Componente "20% riesgos" del Health Score: penaliza por severidad activa. */
  async calculateRiskScore(projectId: string): Promise<number> {
    const activeRisks = await this.risksRepository.find({
      where: { projectId, status: RiskStatus.ACTIVO },
    });
    const penalty = activeRisks.reduce((sum, risk) => {
      if (risk.severity === RiskLevel.ALTO) return sum + 15;
      if (risk.severity === RiskLevel.MEDIO) return sum + 8;
      return sum + 3;
    }, 0);
    return Math.max(0, 100 - penalty);
  }
}
