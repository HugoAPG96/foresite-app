import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  /** Uso interno (incluye passwordHash). Para respuestas HTTP usar findPublicById. */
  findById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }

  /** Datos seguros para exponer: nunca incluye passwordHash. */
  findPublicById(id: string): Promise<PublicUser | null> {
    return this.usersRepository.findOne({ where: { id }, select: { id: true, name: true, email: true } });
  }

  /** Listado para los selectores de responsables/integrantes. */
  findAllPublic(): Promise<PublicUser[]> {
    return this.usersRepository.find({ select: { id: true, name: true, email: true }, order: { name: 'ASC' } });
  }

  /** RF-26: solo se puede editar el nombre (el correo es el identificador de acceso). */
  async updateName(id: string, name: string): Promise<PublicUser> {
    const result = await this.usersRepository.update({ id }, { name });
    if (!result.affected) throw new NotFoundException('Usuario no encontrado');
    return (await this.findPublicById(id)) as PublicUser;
  }

  /** Búsqueda por correo sin distinguir mayúsculas (para agregar integrantes). */
  findPublicByEmail(email: string): Promise<PublicUser | null> {
    return this.usersRepository
      .createQueryBuilder('u')
      .select(['u.id', 'u.name', 'u.email'])
      .where('LOWER(u.email) = LOWER(:email)', { email: email.trim() })
      .getOne();
  }

  create(dto: CreateUserDto) {
    const user = this.usersRepository.create(dto);
    return this.usersRepository.save(user);
  }
}
