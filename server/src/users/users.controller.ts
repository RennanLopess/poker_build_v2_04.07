import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async me(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    return this.usersService.toPublic(user);
  }

  @Get()
  @Roles('admin')
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => this.usersService.toPublic(user));
  }
}
