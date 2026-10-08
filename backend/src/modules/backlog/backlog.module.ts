import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BacklogItem } from './entities/backlog-item.entity';
import { BacklogItemResponsable } from './entities/backlog-item-responsable.entity';
import { BacklogService } from './backlog.service';
import { BacklogController } from './backlog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BacklogItem, BacklogItemResponsable])],
  controllers: [BacklogController],
  providers: [BacklogService],
  exports: [BacklogService],
})
export class BacklogModule {}
