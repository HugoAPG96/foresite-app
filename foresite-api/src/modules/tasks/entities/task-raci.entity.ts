import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** "Consultado" (C) del RACI: puede ser más de una persona por tarea. */
@Entity('task_consulted')
export class TaskConsulted extends BaseEntity {
  @Column({ name: 'task_id', type: 'varchar', length: 36 })
  taskId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;
}

/** "Informado" (I) del RACI: puede ser más de una persona por tarea. */
@Entity('task_informed')
export class TaskInformed extends BaseEntity {
  @Column({ name: 'task_id', type: 'varchar', length: 36 })
  taskId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;
}
