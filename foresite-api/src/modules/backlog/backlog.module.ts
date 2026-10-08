import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from '../projects/projects.module';
import { Task } from '../tasks/entities/task.entity';
import { BacklogController } from './backlog.controller';
import { BacklogService } from './backlog.service';
import { BacklogItemResponsable } from './entities/backlog-item-responsable.entity';
import { BacklogItem } from './entities/backlog-item.entity';

@Module({
  imports: [ProjectsModule, TypeOrmModule.forFeature([BacklogItem, BacklogItemResponsable, Task])],
  controllers: [BacklogController],
  providers: [BacklogService],
  exports: [BacklogService],
})
export class BacklogModule {}
