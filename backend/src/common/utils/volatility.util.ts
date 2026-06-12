import { Volatility } from '../enums/volatility.enum';

/** Parse persisted or cached volatility strings into the enum. */
export function parseVolatility(value: string): Volatility {
  if (value === Volatility.LOW) {
    return Volatility.LOW;
  }
  if (value === Volatility.HIGH) {
    return Volatility.HIGH;
  }
  return Volatility.MEDIUM;
}
