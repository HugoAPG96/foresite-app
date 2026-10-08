import { Column, CreateDateColumn, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum TaskStatus {
  PENDIENTE = 'pendiente',
  EN_PROGRESO = 'en_progreso',
  COMPLETADA = 'completada',
}

@Entity('tasks')
export class Task extends BaseEntity {
  @Column({ name: 'project_id', type: 'varchar', length: 36 })
  projectId: string;

  @Column({ name: 'phase_id', type: 'varchar', length: 36 })
  phaseId: string;

  @Column({ name: 'backlog_item_id', type: 'varchar', length: 36, nullable: true })
  backlogItemId: string | null;

  @Column({ length: 10 })
  code: string; // ej: "3.1"

  @Column({ length: 160 })
  title: string;

  @Column({ name: 'responsible_id', type: 'varchar', length: 36 })
  responsibleId: string;

  @Column({ name: 'accountable_id', type: 'varchar', length: 36 })
  accountableId: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'duration_days', type: 'int' })
  durationDays: number;

  @Column({ name: 'percent_complete', type: 'numeric', precision: 5, scale: 2, default: 0 })
  percentComplete: number;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDIENTE })
  status: TaskStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
