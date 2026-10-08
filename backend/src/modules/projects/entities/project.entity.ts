import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ProjectSemaforo {
  VERDE = 'verde',
  AMBAR = 'ambar',
  ROJO = 'rojo',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
