import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { GameGateway } from '../game/game.gateway';
import { GameService } from '../game/game.service';
import { TablesService } from '../tables/tables.service';
import { UsersService } from '../users/users.service';
import { ChipTransaction } from './chip-transaction.entity';
import { ChipOperationDto } from './dto/chip-operation.dto';

@Controller('manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager')
export class ManagerController {
  constructor(
    private usersService: UsersService,
    private tablesService: TablesService,
    private gameService: GameService,
    private gameGateway: GameGateway,
    @InjectRepository(ChipTransaction)
    private transactionsRepository: Repository<ChipTransaction>,
  ) {}

  @Get('players')
  async players() {
    const users = await this.usersService.findAll();
    return users.map((user) => this.usersService.toPublic(user));
  }

  @Post('chips/:userId')
  async adjustChips(
    @Param('userId') userId: string,
    @Body() dto: ChipOperationDto,
    @Request() req,
  ) {
    const user = await this.usersService.adjustChips(userId, dto.amount, dto.operation);
    const transaction = this.transactionsRepository.create({
      userId,
      managerId: req.user.userId,
      amount: dto.amount,
      operation: dto.operation,
      reason: dto.reason ?? null,
    });
    await this.transactionsRepository.save(transaction);
    return this.usersService.toPublic(user);
  }

  @Get('transactions')
  async transactions() {
    return this.transactionsRepository.find({ order: { createdAt: 'DESC' }, take: 100 });
  }

  @Post('tables/:id/start')
  async startHand(@Param('id') tableId: string) {
    await this.tablesService.findById(tableId);
    await this.gameGateway.startHand(tableId);
    return { started: true };
  }

  @Post('tables/:id/pause')
  async pauseTable(@Param('id') tableId: string) {
    return this.tablesService.setStatus(tableId, 'paused');
  }

  @Post('tables/:id/resume')
  async resumeTable(@Param('id') tableId: string) {
    return this.tablesService.setStatus(tableId, 'active');
  }

  @Post('tables/:id/close')
  async closeTable(@Param('id') tableId: string) {
    const table = await this.tablesService.setStatus(tableId, 'closed');
    await this.gameGateway.closeTable(tableId);
    return table;
  }

  @Post('tables/:id/kick/:userId')
  async kickPlayer(@Param('id') tableId: string, @Param('userId') userId: string) {
    const location = await this.gameService.findSeatLocation(userId);
    if (!location || location.tableId !== tableId) {
      throw new BadRequestException('Jogador não está sentado nesta mesa');
    }
    await this.gameGateway.kickPlayer(tableId, userId);
    return { kicked: true };
  }

  @Get('report')
  async report() {
    return this.gameService.getSessionReport();
  }
}
