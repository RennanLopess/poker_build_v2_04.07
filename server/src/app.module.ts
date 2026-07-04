import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TablesModule } from './tables/tables.module';
import { GameModule } from './game/game.module';
import { ManagerModule } from './manager/manager.module';
import { User } from './users/user.entity';
import { PokerTable } from './tables/table.entity';
import { Game } from './game/game.entity';
import { PlayerSeat } from './game/player-seat.entity';
import { ChipTransaction } from './manager/chip-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'pokerbuild.db',
      entities: [User, PokerTable, Game, PlayerSeat, ChipTransaction],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    TablesModule,
    GameModule,
    ManagerModule,
  ],
})
export class AppModule {}
