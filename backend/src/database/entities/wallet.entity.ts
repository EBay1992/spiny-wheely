import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('wallets')
@Index('idx_wallets_user_id', ['userId'])
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    default: '0.00',
    transformer: {
      to: (value: string) => value,
      from: (value: string) => value,
    },
  })
  balance!: string;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => User, (user) => user.wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
