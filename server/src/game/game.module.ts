import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PokerTable } from '../tables/table.entity';
import { User } from '../users/user.entity';
import { Game } from './game.entity';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { PlayerSeat } from './player-seat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, PlayerSeat, PokerTable, User]),
    AuthModule,
  ],
  providers: [GameService, GameGateway],
  exports: [GameService, GameGateway],
})
export class GameModule {}
