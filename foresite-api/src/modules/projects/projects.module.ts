import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { User } from '../users/entities/user.entity';
import { ProjectMember } from './entities/project-member.entity';
import { Project } from './entities/project.entity';
import { MembersController } from './members.controller';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectMember, User])],
  controllers: [ProjectsController, MembersController],
  providers: [ProjectsService, ProjectAccessGuard],
  exports: [ProjectsService, ProjectAccessGuard],
})
export class ProjectsModule {}
