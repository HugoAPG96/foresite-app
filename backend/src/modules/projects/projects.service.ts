import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly membersRepository: Repository<ProjectMember>,
  ) {}

  async findAllByUser(userId: string): Promise<Project[]> {
    const owned = await this.projectsRepository.find({ where: { createdBy: userId } });
    const memberships = await this.membersRepository.find({ where: { userId } });
    const memberProjectIds = memberships
      .map(m => m.projectId)
      .filter(id => !owned.some(p => p.id === id));

    if (memberProjectIds.length === 0) return owned;

    const memberProjects = await this.projectsRepository.findBy({ id: In(memberProjectIds) });
    return [...owned, ...memberProjects];
  }

  findOne(id: string, userId: string) {
    return this.assertAccess(id, userId);
  }

  /** Dueño o miembro del proyecto. Lanza 404 (no 403) para no filtrar existencia. */
  async assertAccess(projectId: string, userId: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    if (project.createdBy === userId) {
      return project;
    }
    const membership = await this.membersRepository.findOne({ where: { projectId, userId } });
    if (!membership) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }

  /** Solo el creador — usado para agregar miembros. */
  async assertOwner(projectId: string, userId: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    if (project.createdBy !== userId) {
      throw new ForbiddenException('Solo el creador del proyecto puede agregar miembros');
    }
    return project;
  }

  create(dto: CreateProjectDto, userId: string) {
    const project = this.projectsRepository.create({ ...dto, createdBy: userId });
    // La tabla `projects` no genera el id por default (columna sin DEFAULT
    // en el DDL), igual que `users` — se genera acá, no en la base.
    project.id = crypto.randomUUID();
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
