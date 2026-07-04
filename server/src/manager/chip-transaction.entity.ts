import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ChipOperation = 'add' | 'remove' | 'set';

@Entity('chip_transactions')
export class ChipTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  managerId: string;

  @Column('real')
  amount: number;

  @Column()
  operation: ChipOperation;

  @Column({ nullable: true, type: 'text' })
  reason: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
