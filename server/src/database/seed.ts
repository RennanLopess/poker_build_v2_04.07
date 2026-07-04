import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { PokerTable } from '../tables/table.entity';
import { Game } from '../game/game.entity';
import { PlayerSeat } from '../game/player-seat.entity';
import { ChipTransaction } from '../manager/chip-transaction.entity';

const dataSource = new DataSource({
  type: 'better-sqlite3',
  database: 'pokerbuild.db',
  entities: [User, PokerTable, Game, PlayerSeat, ChipTransaction],
  synchronize: true,
});

const USERS: Array<{
  username: string;
  displayName: string;
  password: string;
  role: 'admin' | 'manager' | 'player';
  chips: number;
}> = [
  { username: 'admin', displayName: 'Admin', password: 'admin123', role: 'admin', chips: 0 },
  { username: 'pedro', displayName: 'Pedrão', password: 'explode123', role: 'manager', chips: 0 },
  { username: 'jogador1', displayName: 'Jogador 1', password: 'poker123', role: 'player', chips: 10000 },
  { username: 'jogador2', displayName: 'Jogador 2', password: 'poker123', role: 'player', chips: 10000 },
  { username: 'jogador3', displayName: 'Jogador 3', password: 'poker123', role: 'player', chips: 10000 },
  { username: 'jogador4', displayName: 'Jogador 4', password: 'poker123', role: 'player', chips: 10000 },
  { username: 'jogador5', displayName: 'Jogador 5', password: 'poker123', role: 'player', chips: 10000 },
  { username: 'jogador6', displayName: 'Jogador 6', password: 'poker123', role: 'player', chips: 10000 },
];

const TABLES = [
  {
    name: 'EXplode — Mesa Principal',
    maxSeats: 9,
    smallBlind: 10,
    bigBlind: 20,
    minBuyIn: 200,
    maxBuyIn: 2000,
    rakePercent: 5,
    rakeCap: 3,
    status: 'active' as const,
  },
  {
    name: 'EXplode — Mesa 2',
    maxSeats: 6,
    smallBlind: 25,
    bigBlind: 50,
    minBuyIn: 500,
    maxBuyIn: 5000,
    rakePercent: 5,
    rakeCap: 3,
    status: 'active' as const,
  },
];

async function seed() {
  await dataSource.initialize();
  const usersRepository = dataSource.getRepository(User);
  const tablesRepository = dataSource.getRepository(PokerTable);

  for (const data of USERS) {
    const existing = await usersRepository.findOne({ where: { username: data.username } });
    if (existing) {
      console.log(`Usuário ${data.username} já existe, pulando`);
      continue;
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    await usersRepository.save(
      usersRepository.create({
        username: data.username,
        displayName: data.displayName,
        passwordHash,
        role: data.role,
        chips: data.chips,
        isActive: true,
      }),
    );
    console.log(`Usuário ${data.username} criado (${data.role})`);
  }

  for (const data of TABLES) {
    const existing = await tablesRepository.findOne({ where: { name: data.name } });
    if (existing) {
      console.log(`Mesa "${data.name}" já existe, pulando`);
      continue;
    }
    await tablesRepository.save(tablesRepository.create(data));
    console.log(`Mesa "${data.name}" criada`);
  }

  await dataSource.destroy();
  console.log('Seed concluído.');
}

seed().catch((error) => {
  console.error('Erro no seed:', error);
  process.exit(1);
});
