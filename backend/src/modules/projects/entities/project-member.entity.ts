import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';

@Entity('project_members')
@Unique('uq_project_members', ['projectId', 'userId'])
export class ProjectMember {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  role: string | null;
}
