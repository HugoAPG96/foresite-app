import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('phases')
export class Phase extends BaseEntity {
  @Column({ name: 'project_id', type: 'varchar', length: 36 })
  projectId: string;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;
}
