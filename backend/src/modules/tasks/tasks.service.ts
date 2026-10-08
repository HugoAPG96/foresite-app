import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

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

  async create(projectId: string, dto: CreateTaskDto) {
    const code = await this.generateCode(projectId);
    const durationDays = this.calculateDurationDays(dto.startDate, dto.endDate);
    const task = this.tasksRepository.create({
      ...dto,
      projectId,
      code,
      durationDays,
      backlogItemId: dto.backlogItemId ?? null,
      phaseId: dto.phaseId ?? null,
      accountableId: dto.accountableId ?? null,
    });
    // La tabla `tasks` no genera el id por default — igual que users/projects.
    task.id = crypto.randomUUID();
    return this.tasksRepository.save(task);
  }

  async update(projectId: string, id: string, dto: UpdateTaskDto) {
    const task = await this.tasksRepository.findOne({ where: { id, projectId } });
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    Object.assign(task, dto);
    task.durationDays = this.calculateDurationDays(task.startDate, task.endDate);

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

  private async generateCode(projectId: string): Promise<string> {
    const count = await this.tasksRepository.count({ where: { projectId } });
    return `HU-${String(count + 1).padStart(2, '0')}`;
  }

  private calculateDurationDays(startDate: string, endDate: string): number {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return Math.max(1, Math.round((end - start) / MS_PER_DAY));
  }
}
