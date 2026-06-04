import { GameType } from '../common/enums/game-type.enum';

export const RedisKeys = {
  gameConfig: (gameType: GameType) => `game:config:${gameType}`,
  wheelRound: (roundId: string) => `game:wheel:round:${roundId}`,
  wheelState: () => 'game:wheel:state',
  walletBalance: (userId: string) => `wallet:balance:${userId}`,
} as const;

export const REDIS_TTL = {
  GAME_CONFIG_SECONDS: 300,
  WHEEL_ROUND_SECONDS: 300,
  WHEEL_STATE_SECONDS: 60,
  WALLET_BALANCE_SECONDS: 86_400,
} as const;
