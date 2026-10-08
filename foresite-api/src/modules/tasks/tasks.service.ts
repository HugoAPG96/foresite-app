import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Phase } from '../planning/entities/phase.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskConsulted, TaskInformed } from './entities/task-raci.entity';
import { Task, TaskStatus } from './entities/task.entity';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type TaskView = Task & { consultedIds: string[]; informedIds: string[] };

function omitUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly tasksRepository: Repository<Task>,
    @InjectRepository(TaskConsulted) private readonly consultedRepository: Repository<TaskConsulted>,
    @InjectRepository(TaskInformed) private readonly informedRepository: Repository<TaskInformed>,
    @InjectRepository(Phase) private readonly phasesRepository: Repository<Phase>,
  ) {}

  /** Tareas del proyecto con sus Consultados/Informados. */
  async findAllByProject(projectId: string): Promise<TaskView[]> {
    const tasks = await this.tasksRepository.find({ where: { projectId }, order: { createdAt: 'ASC' } });
    return this.withRaci(tasks);
  }

  async create(projectId: string, dto: CreateTaskDto): Promise<TaskView> {
    this.assertDates(dto.startDate, dto.endDate);
    const phase = await this.getPhase(projectId, dto.phaseId);
    const { consultedIds = [], informedIds = [], ...data } = dto;

    const task = await this.tasksRepository.save(
      this.tasksRepository.create({
        ...data,
        projectId,
        code: await this.nextCode(projectId, phase),
        durationDays: this.durationDays(dto.startDate, dto.endDate),
        backlogItemId: dto.backlogItemId ?? null,
      }),
    );
    await this.replaceRaci(task.id, consultedIds, informedIds);
    return (await this.withRaci([task]))[0];
  }

  async update(projectId: string, taskId: string, dto: UpdateTaskDto): Promise<TaskView> {
    const task = await this.findOneOrFail(projectId, taskId);
    const { consultedIds, informedIds, ...fields } = omitUndefined(dto) as UpdateTaskDto;

    if (fields.phaseId && fields.phaseId !== task.phaseId) {
      const phase = await this.getPhase(projectId, fields.phaseId);
      task.code = await this.nextCode(projectId, phase);
    }
    Object.assign(task, fields);

    this.assertDates(task.startDate, task.endDate);
    task.durationDays = this.durationDays(task.startDate, task.endDate);
    this.normalizeProgress(task);

    await this.tasksRepository.save(task);
    if (consultedIds !== undefined || informedIds !== undefined) {
      await this.replaceRaci(task.id, consultedIds, informedIds);
    }
    return (await this.withRaci([task]))[0];
  }

  async remove(projectId: string, taskId: string): Promise<void> {
    const task = await this.findOneOrFail(projectId, taskId);
    await this.consultedRepository.delete({ taskId: task.id });
    await this.informedRepository.delete({ taskId: task.id });
    await this.tasksRepository.delete({ id: task.id });
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

  // ----------------------------------------------------------------- helpers

  private async findOneOrFail(projectId: string, taskId: string) {
    const task = await this.tasksRepository.findOne({ where: { id: taskId, projectId } });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    return task;
  }

  private async getPhase(projectId: string, phaseId: string) {
    const phase = await this.phasesRepository.findOne({ where: { id: phaseId, projectId } });
    if (!phase) throw new BadRequestException('La fase indicada no existe en este proyecto');
    return phase;
  }

  /** Código tipo "3.2": número de fase + correlativo dentro de la fase. */
  private async nextCode(projectId: string, phase: Phase): Promise<string> {
    const rows = await this.tasksRepository.find({ where: { projectId, phaseId: phase.id }, select: { code: true } });
    const max = rows.reduce((m, t) => {
      const n = Number(t.code.split('.')[1]);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 0);
    return `${phase.orderIndex + 1}.${max + 1}`;
  }

  /** Duración inclusiva en días (14/09 → 16/09 = 3), igual que la planilla RACI. */
  private durationDays(start: string, end: string): number {
    const diff = Math.round((Date.parse(end) - Date.parse(start)) / MS_PER_DAY);
    return Math.max(1, diff + 1);
  }

  private assertDates(start: string, end: string) {
    if (end < start) throw new BadRequestException('La fecha de vencimiento no puede ser anterior a la de inicio');
  }

  /** Mantiene coherentes estado y porcentaje. */
  private normalizeProgress(task: Task) {
    let pct = Number(task.percentComplete) || 0;
    if (task.status === TaskStatus.COMPLETADA) pct = 100;
    else if (pct >= 100) {
      pct = 100;
      task.status = TaskStatus.COMPLETADA;
    } else if (pct > 0 && task.status === TaskStatus.PENDIENTE) task.status = TaskStatus.EN_PROGRESO;
    task.percentComplete = pct;
  }

  private async replaceRaci(taskId: string, consultedIds?: string[], informedIds?: string[]) {
    if (consultedIds !== undefined) {
      await this.consultedRepository.delete({ taskId });
      const ids = Array.from(new Set(consultedIds));
      if (ids.length) await this.consultedRepository.save(ids.map((userId) => this.consultedRepository.create({ taskId, userId })));
    }
    if (informedIds !== undefined) {
      await this.informedRepository.delete({ taskId });
      const ids = Array.from(new Set(informedIds));
      if (ids.length) await this.informedRepository.save(ids.map((userId) => this.informedRepository.create({ taskId, userId })));
    }
  }

  private async withRaci(tasks: Task[]): Promise<TaskView[]> {
    if (!tasks.length) return [];
    const ids = tasks.map((t) => t.id);
    const [consulted, informed] = await Promise.all([
      this.consultedRepository.find({ where: { taskId: In(ids) } }),
      this.informedRepository.find({ where: { taskId: In(ids) } }),
    ]);
    const group = (rows: { taskId: string; userId: string }[], id: string) =>
      rows.filter((r) => r.taskId === id).map((r) => r.userId);
    return tasks.map((t) => Object.assign(t, { consultedIds: group(consulted, t.id), informedIds: group(informed, t.id) }));
  }
}
