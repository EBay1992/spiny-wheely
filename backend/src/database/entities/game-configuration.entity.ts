import {
  Check,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GameType } from '../../common/enums/game-type.enum';
import { Volatility } from '../../common/enums/volatility.enum';
import {
  MAX_TARGET_RTP,
  MIN_TARGET_RTP,
} from '../../common/constants/rtp.constants';

@Entity('game_configurations')
@Check(
  `"target_rtp" >= ${MIN_TARGET_RTP} AND "target_rtp" <= ${MAX_TARGET_RTP}`,
)
export class GameConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'game_type',
    type: 'enum',
    enum: GameType,
    unique: true,
  })
  gameType!: GameType;

  @Column({
    name: 'target_rtp',
    type: 'numeric',
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: string) => value,
      from: (value: string) => value,
    },
  })
  targetRtp!: string;

  @Column({
    type: 'enum',
    enum: Volatility,
    default: Volatility.MEDIUM,
  })
  volatility!: Volatility;

  @Column({ name: 'is_live', type: 'boolean', default: false })
  isLive!: boolean;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
