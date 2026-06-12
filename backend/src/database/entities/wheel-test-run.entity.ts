import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WheelSimulateOutcome } from '../../game-math/wheel/wheel-outcome.resolver';
import { WheelPathStep } from '../../game-math/wheel/wheel-rng.engine';
import { User } from './user.entity';

@Entity('wheel_test_runs')
@Index('idx_wheel_test_runs_created_at', ['createdAt'])
export class WheelTestRun {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'admin_user_id', type: 'uuid', nullable: true })
  adminUserId!: string | null;

  @Column({
    name: 'wager_amount',
    type: 'numeric',
    precision: 18,
    scale: 2,
    transformer: {
      to: (value: string) => value,
      from: (value: string) => value,
    },
  })
  wagerAmount!: string;

  @Column({ name: 'small_rotation', type: 'double precision' })
  smallRotation!: number;

  @Column({ name: 'middle_rotation', type: 'double precision' })
  middleRotation!: number;

  @Column({ name: 'big_rotation', type: 'double precision' })
  bigRotation!: number;

  @Column({ name: 'path', type: 'jsonb' })
  path!: WheelPathStep[];

  @Column({ name: 'final_label', type: 'varchar', length: 32 })
  finalLabel!: string;

  @Column({ name: 'multiplier', type: 'double precision' })
  multiplier!: number;

  @Column({
    name: 'payout_amount',
    type: 'numeric',
    precision: 18,
    scale: 2,
    transformer: {
      to: (value: string) => value,
      from: (value: string) => value,
    },
  })
  payoutAmount!: string;

  @Column({
    name: 'net_result',
    type: 'numeric',
    precision: 18,
    scale: 2,
    transformer: {
      to: (value: string) => value,
      from: (value: string) => value,
    },
  })
  netResult!: string;

  @Column({ name: 'selected_segments', type: 'jsonb' })
  selectedSegments!: WheelSimulateOutcome['selectedSegments'];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'admin_user_id' })
  adminUser?: User;
}
