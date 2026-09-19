import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('backlog_item_responsables')
export class BacklogItemResponsable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'backlog_item_id', type: 'uuid' })
  backlogItemId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;
}
