import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
export class Risk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
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

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({ name: 'linked_task_id', type: 'uuid', nullable: true })
  linkedTaskId: string | null;

  @Column({ name: 'linked_backlog_item_id', type: 'uuid', nullable: true })
  linkedBacklogItemId: string | null;

  @Column({ type: 'enum', enum: RiskStatus, default: RiskStatus.ACTIVO })
  status: RiskStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
