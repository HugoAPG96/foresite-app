import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';
import { CreateBacklogItemDto } from './dto/create-backlog-item.dto';
import { UpdateBacklogItemDto } from './dto/update-backlog-item.dto';
import { BacklogItem, BacklogItemType } from './entities/backlog-item.entity';
import { BacklogItemResponsable } from './entities/backlog-item-responsable.entity';

export type BacklogItemView = BacklogItem & { responsableIds: string[] };

const TYPE_PREFIX: Record<BacklogItemType, string> = {
  [BacklogItemType.EP]: 'EP',
  [BacklogItemType.HU]: 'HU',
  [BacklogItemType.SP]: 'SP',
  [BacklogItemType.EN]: 'EN',
  [BacklogItemType.TA]: 'TA',
  [BacklogItemType.RN]: 'RN',
  [BacklogItemType.DO]: 'DO',
  [BacklogItemType.BU]: 'BU',
};

function omitUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

@Injectable()
export class BacklogService {
  constructor(
    @InjectRepository(BacklogItem) private readonly backlogRepository: Repository<BacklogItem>,
    @InjectRepository(BacklogItemResponsable) private readonly responsablesRepository: Repository<BacklogItemResponsable>,
    @InjectRepository(Task) private readonly tasksRepository: Repository<Task>,
  ) {}

  async findAllByProject(projectId: string): Promise<BacklogItemView[]> {
    const items = await this.backlogRepository.find({ where: { projectId }, order: { createdAt: 'ASC' } });
    return this.withResponsables(items);
  }

  async create(projectId: string, dto: CreateBacklogItemDto): Promise<BacklogItemView> {
    this.assertDates(dto.startDate, dto.endDate);
    await this.assertDependency(projectId, dto.dependencyId, null);
    const { responsableIds, ...rest } = dto;

    const item = await this.backlogRepository.save(
      this.backlogRepository.create({
        ...omitUndefined(rest),
        projectId,
        code: await this.nextCode(projectId, dto.type),
      }),
    );
    await this.replaceResponsables(item.id, responsableIds);
    return (await this.withResponsables([item]))[0];
  }

  async update(projectId: string, itemId: string, dto: UpdateBacklogItemDto): Promise<BacklogItemView> {
    const item = await this.findOneOrFail(projectId, itemId);
    const { responsableIds, ...fields } = omitUndefined(dto) as UpdateBacklogItemDto;

    if (fields.type && fields.type !== item.type) item.code = await this.nextCode(projectId, fields.type);
    Object.assign(item, fields);

    this.assertDates(item.startDate, item.endDate);
    await this.assertDependency(projectId, item.dependencyId, item.id);

    await this.backlogRepository.save(item);
    if (responsableIds !== undefined) await this.replaceResponsables(item.id, responsableIds);
    return (await this.withResponsables([item]))[0];
  }

  /** Elimina el ítem; sus tareas del cronograma se conservan sin vínculo. */
  async remove(projectId: string, itemId: string): Promise<void> {
    const item = await this.findOneOrFail(projectId, itemId);
    await this.responsablesRepository.delete({ backlogItemId: item.id });
    await this.tasksRepository.update({ backlogItemId: item.id }, { backlogItemId: null });
    await this.backlogRepository.update({ dependencyId: item.id }, { dependencyId: null });
    await this.backlogRepository.delete({ id: item.id });
  }

  // ----------------------------------------------------------------- helpers

  private async findOneOrFail(projectId: string, itemId: string) {
    const item = await this.backlogRepository.findOne({ where: { id: itemId, projectId } });
    if (!item) throw new NotFoundException('Ítem del backlog no encontrado');
    return item;
  }

  /** Código tipo "HU-003": prefijo del tipo + correlativo por proyecto y tipo. */
  private async nextCode(projectId: string, type: BacklogItemType): Promise<string> {
    const rows = await this.backlogRepository.find({ where: { projectId, type }, select: { code: true } });
    const max = rows.reduce((m, r) => {
      const n = Number(r.code.split('-')[1]);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 0);
    return `${TYPE_PREFIX[type]}-${String(max + 1).padStart(3, '0')}`;
  }

  private assertDates(start?: string | null, end?: string | null) {
    if (start && end && end < start) throw new BadRequestException('La fecha de fin no puede ser anterior a la de inicio');
  }

  private async assertDependency(projectId: string, dependencyId?: string | null, selfId?: string | null) {
    if (!dependencyId) return;
    if (dependencyId === selfId) throw new BadRequestException('Un ítem no puede depender de sí mismo');
    const dep = await this.backlogRepository.findOne({ where: { id: dependencyId, projectId }, select: { id: true } });
    if (!dep) throw new BadRequestException('La dependencia indicada no existe en este proyecto');
  }

  private async replaceResponsables(itemId: string, userIds: string[]) {
    await this.responsablesRepository.delete({ backlogItemId: itemId });
    const ids = Array.from(new Set(userIds));
    if (ids.length) {
      await this.responsablesRepository.save(ids.map((userId) => this.responsablesRepository.create({ backlogItemId: itemId, userId })));
    }
  }

  private async withResponsables(items: BacklogItem[]): Promise<BacklogItemView[]> {
    if (!items.length) return [];
    const rows = await this.responsablesRepository.find({ where: { backlogItemId: In(items.map((i) => i.id)) } });
    return items.map((i) =>
      Object.assign(i, { responsableIds: rows.filter((r) => r.backlogItemId === i.id).map((r) => r.userId) }),
    );
  }
}
