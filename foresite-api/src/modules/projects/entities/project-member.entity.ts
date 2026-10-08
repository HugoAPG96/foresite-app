import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('project_members')
export class ProjectMember extends BaseEntity {
  @Column({ name: 'project_id', type: 'varchar', length: 36 })
  projectId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  role: string | null;
}
