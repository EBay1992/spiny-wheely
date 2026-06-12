/** Signed USD display, e.g. +$0.50 or -$1.00 (sign always before $). */
export function formatSignedUsd(amount: number): string {
  const abs = Math.abs(amount).toFixed(2);
  return amount >= 0 ? `+$${abs}` : `-$${abs}`;
}
