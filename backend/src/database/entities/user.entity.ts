import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { BetSession } from './bet-session.entity';
import { Wallet } from './wallet.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PLAYER,
  })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet?: Wallet;

  @OneToMany(() => BetSession, (session) => session.user)
  betSessions?: BetSession[];
}
