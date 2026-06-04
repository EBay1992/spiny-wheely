import { GameType } from '../../common/enums/game-type.enum';

export class BetSettledEvent {
  constructor(
    public readonly userId: string,
    public readonly gameType: GameType,
    public readonly betAmount: string,
    public readonly winAmount: string,
    public readonly idempotencyKey: string,
  ) {}
}
