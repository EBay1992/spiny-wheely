import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';
import { MAX_WAGER, MIN_WAGER } from '../../../common/constants/wager.constants';

/** Client sends wager only — player identity comes from JWT. */
export class SpinDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(MIN_WAGER)
  @Max(MAX_WAGER)
  wagerAmount!: number;
}
