import { Column, CreateDateColumn, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum ProjectSemaforo {
  VERDE = 'verde',
  AMBAR = 'ambar',
  ROJO = 'rojo',
}

@Entity('projects')
export class Project extends BaseEntity {
  @Column({ length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  objective: string;

  @Column({ type: 'text', nullable: true })
  scope: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({ name: 'health_score', type: 'numeric', precision: 5, scale: 2, default: 0 })
  healthScore: number;

  @Column({ type: 'enum', enum: ProjectSemaforo, default: ProjectSemaforo.VERDE })
  semaforo: ProjectSemaforo;

  @Column({ name: 'created_by', type: 'varchar', length: 36 })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
