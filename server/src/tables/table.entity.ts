import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type TableStatus = 'active' | 'paused' | 'closed';

@Entity('poker_tables')
export class PokerTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: 9 })
  maxSeats: number;

  @Column('real')
  smallBlind: number;

  @Column('real')
  bigBlind: number;

  @Column('real')
  minBuyIn: number;

  @Column('real')
  maxBuyIn: number;

  @Column('real', { default: 5 })
  rakePercent: number;

  @Column('real', { default: 3 })
  rakeCap: number;

  @Column({ default: 'active' })
  status: TableStatus;

  @Column('real', { default: 0 })
  totalRake: number;
}
