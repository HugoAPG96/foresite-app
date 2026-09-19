import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  findAllByProject(projectId: string) {
    return this.tasksRepository.find({ where: { projectId } });
  }

  create(projectId: string, code: string, dto: CreateTaskDto) {
    const durationDays = this.calculateDurationDays(dto.startDate, dto.endDate);
    const task = this.tasksRepository.create({
      ...dto,
      projectId,
      code,
      durationDays,
      backlogItemId: dto.backlogItemId ?? null,
    });
    return this.tasksRepository.save(task);
  }

  /** Velocidad histórica: tareas completadas por día en los últimos N días. */
  async calculateHistoricVelocity(projectId: string, windowDays = 14): Promise<number> {
    const since = new Date(Date.now() - windowDays * MS_PER_DAY);
    const completed = await this.tasksRepository
      .createQueryBuilder('task')
      .where('task.projectId = :projectId', { projectId })
      .andWhere("task.status = 'completada'")
      .andWhere('task.createdAt >= :since', { since })
      .getCount();
    return completed / windowDays;
  }

  private calculateDurationDays(startDate: string, endDate: string): number {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return Math.max(1, Math.round((end - start) / MS_PER_DAY));
  }
}
