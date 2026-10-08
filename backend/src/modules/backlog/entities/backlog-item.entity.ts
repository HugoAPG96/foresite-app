import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum BacklogItemType {
  EPICA = 'epica',
  HU = 'hu',
  SPIKE = 'spike',
  BUG = 'bug',
  ENABLER = 'enabler',
}

export enum BacklogItemPriority {
  ALTA = 'alta',
  MEDIA = 'media',
  BAJA = 'baja',
}

export enum BacklogItemStatus {
  OPEN = 'open',
  DOING = 'doing',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

@Entity('backlog_items')
export class BacklogItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'phase_id', type: 'uuid', nullable: true })
  phaseId: string | null;

  @Column({ name: 'sprint_id', type: 'uuid', nullable: true })
  sprintId: string | null;

  @Column({ type: 'enum', enum: BacklogItemType })
  type: BacklogItemType;

  @Column({ length: 10 })
  code: string; // ej: "HU-001"

  @Column({ length: 160 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'acceptance_criteria', type: 'text', nullable: true })
  acceptanceCriteria: string;

  @Column({ type: 'enum', enum: BacklogItemPriority, default: BacklogItemPriority.MEDIA })
  priority: BacklogItemPriority;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  estimation: number;

  @Column({ type: 'enum', enum: BacklogItemStatus, default: BacklogItemStatus.OPEN })
  status: BacklogItemStatus;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string | null;

  @Column({ name: 'dependency_id', type: 'uuid', nullable: true })
  dependencyId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
