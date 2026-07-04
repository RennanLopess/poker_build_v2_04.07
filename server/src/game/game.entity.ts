import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type GamePhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tableId: string;

  @Column({ default: 'waiting' })
  phase: GamePhase;

  @Column({ default: 0 })
  handNumber: number;

  @Column('real', { default: 0 })
  pot: number;

  @Column({ default: '[]' })
  communityCards: string;

  @Column({ default: '[]' })
  deck: string;

  @Column({ default: -1 })
  dealerPosition: number;

  @Column({ nullable: true, type: 'text' })
  currentTurnUserId: string | null;

  @Column('real', { default: 0 })
  currentBetAmount: number;

  @Column('real', { default: 0 })
  lastRaiseAmount: number;

  @Column({ nullable: true, type: 'datetime' })
  startedAt: Date | null;
}
