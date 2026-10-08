import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('sprints')
export class Sprint extends BaseEntity {
  @Column({ name: 'project_id', type: 'varchar', length: 36 })
  projectId: string;

  @Column({ type: 'int' })
  number: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;
}
