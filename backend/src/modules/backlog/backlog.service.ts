import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BacklogItem } from './entities/backlog-item.entity';
import { BacklogItemResponsable } from './entities/backlog-item-responsable.entity';
import { CreateBacklogItemDto } from './dto/create-backlog-item.dto';

@Injectable()
export class BacklogService {
  constructor(
    @InjectRepository(BacklogItem)
    private readonly backlogRepository: Repository<BacklogItem>,
    @InjectRepository(BacklogItemResponsable)
    private readonly responsablesRepository: Repository<BacklogItemResponsable>,
  ) {}

  findAllByProject(projectId: string) {
    return this.backlogRepository.find({ where: { projectId } });
  }

  async create(projectId: string, code: string, dto: CreateBacklogItemDto) {
    const { responsableIds, ...rest } = dto;
    const item = this.backlogRepository.create({ ...rest, projectId, code });
    const saved = await this.backlogRepository.save(item);

    const links = responsableIds.map((userId) =>
      this.responsablesRepository.create({ backlogItemId: saved.id, userId }),
    );
    await this.responsablesRepository.save(links);

    return saved;
  }

  /**
   * Recalcula % y status del ítem a partir de sus tareas hijas en el cronograma
   * (evita que se dupliquen o desincronicen ambos valores manualmente).
   * Se implementa al integrar con TasksService.
   */
  async recalculateProgress(_backlogItemId: string): Promise<void> {
    // TODO: sumar percentComplete de las tareas vinculadas (task.backlogItemId)
  }
}
