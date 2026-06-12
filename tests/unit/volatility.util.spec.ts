import { Volatility } from '../../backend/src/common/enums/volatility.enum';
import { parseVolatility } from '../../backend/src/common/utils/volatility.util';

describe('parseVolatility', () => {
  it('returns LOW for LOW', () => {
    expect(parseVolatility(Volatility.LOW)).toBe(Volatility.LOW);
  });

  it('returns HIGH for HIGH', () => {
    expect(parseVolatility(Volatility.HIGH)).toBe(Volatility.HIGH);
  });

  it('returns MEDIUM for MEDIUM', () => {
    expect(parseVolatility(Volatility.MEDIUM)).toBe(Volatility.MEDIUM);
  });

  it('defaults unknown values to MEDIUM', () => {
    expect(parseVolatility('INVALID')).toBe(Volatility.MEDIUM);
    expect(parseVolatility('')).toBe(Volatility.MEDIUM);
  });
});
