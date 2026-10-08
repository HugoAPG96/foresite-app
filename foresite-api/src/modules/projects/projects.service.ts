import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectMember } from './entities/project-member.entity';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projectsRepository: Repository<Project>,
    @InjectRepository(ProjectMember) private readonly membersRepository: Repository<ProjectMember>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  /** Proyectos que creó el usuario o donde figura como integrante. */
  findAllByUser(userId: string) {
    return this.projectsRepository
      .createQueryBuilder('p')
      .where('p.createdBy = :userId', { userId })
      .orWhere('p.id IN (SELECT pm.project_id FROM project_members pm WHERE pm.user_id = :userId)', { userId })
      .orderBy('p.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string) {
    const project = await this.projectsRepository.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return project;
  }

  async create(dto: CreateProjectDto, userId: string) {
    if (dto.endDate < dto.startDate) {
      throw new BadRequestException('La fecha límite no puede ser anterior a la fecha de inicio');
    }
    const { memberIds = [], ...data } = dto;

    const memberSet = Array.from(new Set([userId, ...memberIds]));
    const existing = await this.usersRepository.find({ where: { id: In(memberSet) }, select: { id: true } });
    if (existing.length !== memberSet.length) {
      throw new BadRequestException('Alguno de los integrantes seleccionados no existe');
    }

    const project = await this.projectsRepository.save(this.projectsRepository.create({ ...data, createdBy: userId }));
    await this.membersRepository.save(
      memberSet.map((id) =>
        this.membersRepository.create({ projectId: project.id, userId: id, role: id === userId ? 'Director' : 'Integrante' }),
      ),
    );
    return project;
  }

  /** El usuario debe ser el creador (director) o un integrante del proyecto. */
  async assertAccess(projectId: string, userId: string): Promise<void> {
    const project = await this.findOne(projectId);
    if (project.createdBy === userId) return;
    const member = await this.membersRepository.findOne({ where: { projectId, userId } });
    if (!member) throw new ForbiddenException('No tienes acceso a este proyecto');
  }

  /** Solo el Scrum Master (creador del proyecto) puede administrar sus integrantes. */
  async assertOwner(projectId: string, userId: string): Promise<void> {
    const project = await this.findOne(projectId);
    if (project.createdBy !== userId) {
      throw new ForbiddenException('Solo el Scrum Master del proyecto puede realizar esta acción');
    }
  }

  /**
   * Agrega como integrante a un usuario ya registrado, buscándolo por correo.
   * 404 si el correo no pertenece a un usuario registrado; 409 si ya es integrante.
   */
  async addMemberByEmail(projectId: string, email: string) {
    const user = await this.usersRepository
      .createQueryBuilder('u')
      .select(['u.id', 'u.name', 'u.email'])
      .where('LOWER(u.email) = LOWER(:email)', { email: email.trim() })
      .getOne();
    if (!user) throw new NotFoundException(`No existe un usuario registrado con el correo ${email.trim()}`);

    const project = await this.findOne(projectId);
    const already =
      project.createdBy === user.id || (await this.membersRepository.findOne({ where: { projectId, userId: user.id } }));
    if (already) throw new ConflictException('Ese usuario ya es integrante del proyecto');

    await this.membersRepository.save(this.membersRepository.create({ projectId, userId: user.id, role: 'Integrante' }));
    return { id: user.id, name: user.name, email: user.email };
  }

  /** Integrantes del proyecto (sin datos sensibles). */
  async members(projectId: string) {
    await this.findOne(projectId);
    return this.usersRepository
      .createQueryBuilder('u')
      .innerJoin(ProjectMember, 'pm', 'pm.userId = u.id')
      .where('pm.projectId = :projectId', { projectId })
      .select(['u.id', 'u.name', 'u.email'])
      .orderBy('u.name', 'ASC')
      .getMany();
  }
}
