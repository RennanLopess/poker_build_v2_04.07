import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameModule } from '../game/game.module';
import { TablesModule } from '../tables/tables.module';
import { UsersModule } from '../users/users.module';
import { ChipTransaction } from './chip-transaction.entity';
import { ManagerController } from './manager.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChipTransaction]),
    UsersModule,
    TablesModule,
    GameModule,
  ],
  controllers: [ManagerController],
})
export class ManagerModule {}
