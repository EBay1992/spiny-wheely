import { GameType } from '../../common/enums/game-type.enum';

export class BetPlacedEvent {
  constructor(
    public readonly userId: string,
    public readonly gameType: GameType,
    public readonly betAmount: string,
    public readonly idempotencyKey: string,
  ) {}
}
