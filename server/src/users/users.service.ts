import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepository: Repository<User>) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'ASC' } });
  }

  async adjustChips(userId: string, amount: number, operation: 'add' | 'remove' | 'set'): Promise<User> {
    const user = await this.findById(userId);
    if (amount < 0) {
      throw new BadRequestException('Valor deve ser positivo');
    }
    if (operation === 'add') {
      user.chips += amount;
    } else if (operation === 'remove') {
      if (user.chips < amount) {
        throw new BadRequestException('Saldo insuficiente para remover');
      }
      user.chips -= amount;
    } else {
      user.chips = amount;
    }
    return this.usersRepository.save(user);
  }

  toPublic(user: User) {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      chips: user.chips,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
