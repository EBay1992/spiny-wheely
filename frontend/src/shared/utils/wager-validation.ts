export interface WagerValidationResult {
  valid: boolean;
  error: string | null;
}

export function validateWager(
  amount: number,
  minWager: number,
  maxWager: number,
  balance: number,
): WagerValidationResult {
  if (Number.isNaN(amount)) {
    return { valid: false, error: 'Enter a valid wager amount.' };
  }

  if (amount < minWager) {
    return {
      valid: false,
      error: `Wager must be at least $${minWager.toFixed(2)}.`,
    };
  }

  if (amount > maxWager) {
    return {
      valid: false,
      error: `Wager must not exceed $${maxWager.toFixed(2)}.`,
    };
  }

  if (amount > balance) {
    return {
      valid: false,
      error: `Insufficient balance — you have $${balance.toFixed(2)}.`,
    };
  }

  return { valid: true, error: null };
}

/** Maps raw API / validation messages to player-friendly copy. */
export function formatWagerError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('wageramount') && lower.includes('less')) {
    return 'Wager must be at least $0.10.';
  }
  if (lower.includes('wageramount') && lower.includes('greater')) {
    return 'Wager exceeds the maximum allowed.';
  }
  if (lower.includes('insufficient')) {
    return message;
  }

  return message;
}

export function roundWager(amount: number): number {
  return Number(amount.toFixed(2));
}

export function isSameWager(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.001;
}

/** Five evenly spaced preset amounts within min, max, and balance. */
export function buildWagerPresets(
  minWager: number,
  maxWager: number,
  balance: number,
  count = 5,
): number[] {
  const effectiveMax = Math.min(maxWager, balance);
  if (effectiveMax < minWager) return [];

  const anchors = [0.5, 1, 2, 5, 10, 20, 25, 50, 100];
  const valid = anchors
    .filter((v) => v >= minWager && v <= effectiveMax)
    .map(roundWager);

  const withBounds = [
    ...new Set([roundWager(minWager), ...valid, roundWager(effectiveMax)]),
  ].sort((a, b) => a - b);

  if (withBounds.length <= count) return withBounds;

  const result: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const idx = Math.round((i / (count - 1)) * (withBounds.length - 1));
    result.push(withBounds[idx]);
  }

  return [...new Set(result)];
}

export function formatWagerAmount(amount: number): string {
  return amount.toFixed(2);
}
