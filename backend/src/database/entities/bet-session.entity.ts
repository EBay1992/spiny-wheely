import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GameType } from '../../common/enums/game-type.enum';
import { User } from './user.entity';

@Entity('bet_sessions')
@Index('idx_bet_sessions_user_id_timestamp', ['userId', 'timestamp'])
@Index('idx_bet_sessions_timestamp', ['timestamp'])
export class BetSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({
    name: 'game_type',
    type: 'enum',
    enum: GameType,
  })
  gameType!: GameType;

  @Column({
    name: 'bet_amount',
    type: 'numeric',
    precision: 18,
    scale: 2,
    transformer: {
      to: (value: string) => value,
      from: (value: string) => value,
    },
  })
  betAmount!: string;

  @Column({
    name: 'win_amount',
    type: 'numeric',
    precision: 18,
    scale: 2,
    default: '0.00',
    transformer: {
      to: (value: string) => value,
      from: (value: string) => value,
    },
  })
  winAmount!: string;

  @Column({
    name: 'net_profit',
    type: 'numeric',
    precision: 18,
    scale: 2,
    transformer: {
      to: (value: string) => value,
      from: (value: string) => value,
    },
  })
  netProfit!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp!: Date;

  @ManyToOne(() => User, (user) => user.betSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
