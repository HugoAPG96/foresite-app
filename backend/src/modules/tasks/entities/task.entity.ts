import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum TaskStatus {
  PENDIENTE = 'pendiente',
  EN_PROGRESO = 'en_progreso',
  COMPLETADA = 'completada',
}

export enum TaskPriority {
  ALTA = 'alta',
  MEDIA = 'media',
  BAJA = 'baja',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'phase_id', type: 'uuid', nullable: true })
  phaseId: string | null;

  @Column({ name: 'backlog_item_id', type: 'uuid', nullable: true })
  backlogItemId: string | null;

  @Column({ length: 10 })
  code: string; // ej: "HU-01"

  @Column({ length: 160 })
  title: string;

  @Column({ name: 'responsible_id', type: 'uuid' })
  responsibleId: string;

  @Column({ name: 'accountable_id', type: 'uuid', nullable: true })
  accountableId: string | null;

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

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIA })
  priority: TaskPriority;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
