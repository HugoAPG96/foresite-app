import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from './entities/project-member.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly membersRepository: Repository<ProjectMember>,
    private readonly usersService: UsersService,
  ) {}

  async list(projectId: string) {
    const members = await this.membersRepository.find({ where: { projectId } });
    const users = await Promise.all(members.map(m => this.usersService.findById(m.userId)));
    return members.map((m, i) => ({
      id: m.id,
      role: m.role,
      user: users[i] ? { id: users[i]!.id, name: users[i]!.name, email: users[i]!.email } : null,
    }));
  }

  async addByEmail(projectId: string, email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('No existe un usuario registrado con ese correo');
    }

    const existing = await this.membersRepository.findOne({ where: { projectId, userId: user.id } });
    if (existing) {
      throw new ConflictException('Ese usuario ya es miembro del proyecto');
    }

    const member = this.membersRepository.create({ projectId, userId: user.id, role: null });
    member.id = crypto.randomUUID();
    await this.membersRepository.save(member);

    return { id: member.id, role: member.role, user: { id: user.id, name: user.name, email: user.email } };
  }
}
