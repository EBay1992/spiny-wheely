export interface BetHistoryCursor {
  timestamp: string;
  id: string;
}

export function encodeBetHistoryCursor(
  timestamp: Date,
  id: string,
): string {
  const payload: BetHistoryCursor = {
    timestamp: timestamp.toISOString(),
    id,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeBetHistoryCursor(cursor: string): BetHistoryCursor {
  try {
    const payload = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as BetHistoryCursor;

    if (!payload.timestamp || !payload.id) {
      throw new Error('Invalid cursor payload');
    }

    return payload;
  } catch {
    throw new Error('Invalid bet history cursor');
  }
}
