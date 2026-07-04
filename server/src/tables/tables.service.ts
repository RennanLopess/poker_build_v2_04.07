import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Game } from '../game/game.entity';
import { PlayerSeat } from '../game/player-seat.entity';
import { PokerTable, TableStatus } from './table.entity';
import { CreateTableDto } from './dto/create-table.dto';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(PokerTable) private tablesRepository: Repository<PokerTable>,
    @InjectRepository(Game) private gamesRepository: Repository<Game>,
    @InjectRepository(PlayerSeat) private seatsRepository: Repository<PlayerSeat>,
  ) {}

  async findAllWithPlayerCount() {
    const tables = await this.tablesRepository.find({ order: { name: 'ASC' } });
    const games = await this.gamesRepository.find({
      where: { tableId: In(tables.map((table) => table.id)) },
    });
    const gameByTable = new Map(games.map((game) => [game.tableId, game]));
    const result = [];
    for (const table of tables) {
      const game = gameByTable.get(table.id);
      const playerCount = game
        ? await this.seatsRepository.count({ where: { gameId: game.id } })
        : 0;
      result.push({ ...table, playerCount });
    }
    return result;
  }

  async findById(id: string): Promise<PokerTable> {
    const table = await this.tablesRepository.findOne({ where: { id } });
    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }
    return table;
  }

  async create(dto: CreateTableDto): Promise<PokerTable> {
    if (dto.bigBlind < dto.smallBlind) {
      throw new BadRequestException('Big blind deve ser maior ou igual ao small blind');
    }
    if (dto.maxBuyIn < dto.minBuyIn) {
      throw new BadRequestException('Buy-in máximo deve ser maior ou igual ao mínimo');
    }
    const table = this.tablesRepository.create({
      name: dto.name,
      maxSeats: dto.maxSeats ?? 9,
      smallBlind: dto.smallBlind,
      bigBlind: dto.bigBlind,
      minBuyIn: dto.minBuyIn,
      maxBuyIn: dto.maxBuyIn,
      rakePercent: dto.rakePercent ?? 5,
      rakeCap: dto.rakeCap ?? 3,
      status: dto.status ?? 'active',
    });
    return this.tablesRepository.save(table);
  }

  async setStatus(id: string, status: TableStatus): Promise<PokerTable> {
    const table = await this.findById(id);
    table.status = status;
    return this.tablesRepository.save(table);
  }
}
