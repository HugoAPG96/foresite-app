import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string) {
    console.log(`email:${email}`);
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }

  create(dto: CreateUserDto) {
    const user = this.usersRepository.create(dto);
    user.id = crypto.randomUUID();
    console.log(`create-user:${user.id}`);
    return this.usersRepository.save(user);
  }
}
