import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

  findAllByUser(userId: string) {
    // MVP: se filtrará por project_members cuando exista esa tabla puente.
    return this.projectsRepository.find({ where: { createdBy: userId } });
  }

  async findOne(id: string) {
    const project = await this.projectsRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }

  create(dto: CreateProjectDto, userId: string) {
    const project = this.projectsRepository.create({ ...dto, createdBy: userId });
    return this.projectsRepository.save(project);
  }

  /**
   * Recalcula el Health Score: 40% avance + 30% cumplimiento de fechas
   * + 20% riesgos + 10% participación del equipo.
   * Se implementa cuando estén listos los módulos de tareas y riesgos,
   * de los que depende cada componente de la fórmula.
   */
  async recalculateHealthScore(_projectId: string): Promise<number> {
    // TODO: integrar con TasksService y RisksService
    return 0;
  }
}
