import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type SeatStatus = 'waiting' | 'active' | 'folded' | 'all_in';

@Entity('player_seats')
export class PlayerSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  gameId: string;

  @Column()
  userId: string;

  @Column()
  username: string;

  @Column()
  displayName: string;

  @Column()
  seatPosition: number;

  @Column('real', { default: 0 })
  stackSize: number;

  @Column('real', { default: 0 })
  currentBet: number;

  @Column('real', { default: 0 })
  totalBetInHand: number;

  @Column({ nullable: true, type: 'text' })
  holeCards: string | null;

  @Column({ default: 'waiting' })
  status: SeatStatus;

  @Column({ default: false })
  isDealer: boolean;

  @Column({ default: false })
  isSmallBlind: boolean;

  @Column({ default: false })
  isBigBlind: boolean;

  @Column({ default: false })
  hasActed: boolean;

  @Column({ default: true })
  isConnected: boolean;
}
