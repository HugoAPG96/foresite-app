import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('backlog_item_responsables')
export class BacklogItemResponsable extends BaseEntity {
  @Column({ name: 'backlog_item_id', type: 'varchar', length: 36 })
  backlogItemId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;
}
