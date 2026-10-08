import { Column, CreateDateColumn, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum RiskLevel {
  ALTO = 'alto',
  MEDIO = 'medio',
  BAJO = 'bajo',
}

export enum RiskStatus {
  ACTIVO = 'activo',
  MITIGADO = 'mitigado',
  CERRADO = 'cerrado',
}

@Entity('risks')
export class Risk extends BaseEntity {
  @Column({ name: 'project_id', type: 'varchar', length: 36 })
  projectId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: RiskLevel })
  probability: RiskLevel;

  @Column({ type: 'enum', enum: RiskLevel })
  impact: RiskLevel;

  @Column({ type: 'enum', enum: RiskLevel })
  severity: RiskLevel;

  @Column({ type: 'text' })
  mitigation: string;

  @Column({ name: 'owner_id', type: 'varchar', length: 36 })
  ownerId: string;

  @Column({ name: 'linked_task_id', type: 'varchar', length: 36, nullable: true })
  linkedTaskId: string | null;

  @Column({ name: 'linked_backlog_item_id', type: 'varchar', length: 36, nullable: true })
  linkedBacklogItemId: string | null;

  @Column({ type: 'enum', enum: RiskStatus, default: RiskStatus.ACTIVO })
  status: RiskStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
