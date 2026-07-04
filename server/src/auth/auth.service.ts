import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({ where: { username: dto.username } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }
    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }
    return this.buildAuthResponse(user);
  }

  async register(dto: RegisterDto, authorizationHeader?: string) {
    const userCount = await this.usersRepository.count();
    let role: string = 'player';

    if (userCount === 0) {
      role = 'admin';
    } else {
      const requester = this.verifyBearerToken(authorizationHeader);
      if (requester.role !== 'admin') {
        throw new ForbiddenException('Apenas admin pode criar usuários');
      }
      role = dto.role ?? 'player';
    }

    const existing = await this.usersRepository.findOne({ where: { username: dto.username } });
    if (existing) {
      throw new ConflictException('Nome de usuário já existe');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      username: dto.username,
      displayName: dto.displayName,
      passwordHash,
      role: role as User['role'],
      chips: 0,
      isActive: true,
    });
    await this.usersRepository.save(user);
    return this.buildAuthResponse(user);
  }

  private verifyBearerToken(authorizationHeader?: string): JwtPayload {
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token ausente');
    }
    try {
      return this.jwtService.verify<JwtPayload>(authorizationHeader.slice(7));
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }

  private buildAuthResponse(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        chips: user.chips,
        role: user.role,
      },
    };
  }
}
