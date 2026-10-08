import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from '../projects/projects.module';
import { Risk } from './entities/risk.entity';
import { RisksService } from './risks.service';
import { RisksController } from './risks.controller';

@Module({
  imports: [ProjectsModule, TypeOrmModule.forFeature([Risk])],
  controllers: [RisksController],
  providers: [RisksService],
  exports: [RisksService],
})
export class RisksModule {}
