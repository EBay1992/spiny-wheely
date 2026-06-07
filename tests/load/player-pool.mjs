/**
 * Load-test player pool — one funded wallet per concurrent wheel worker.
 */
const DEFAULT_PASSWORD = 'player123';

export function loadPlayerEmail(index) {
  return `load-player-${String(index).padStart(2, '0')}@spinywheely.test`;
}

async function login(apiUrl, email, password) {
  const res = await fetch(`${apiUrl}/player/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`login failed for ${email}: ${res.status}`);
  }

  const body = await res.json();
  return body.accessToken;
}

/**
 * @returns {Promise<Array<{ email: string, token: string }>>}
 */
export async function createPlayerPool(apiUrl, {
  count,
  password = DEFAULT_PASSWORD,
  fallbackEmail,
}) {
  const players = [];

  for (let index = 1; index <= count; index += 1) {
    const email = loadPlayerEmail(index);
    try {
      const token = await login(apiUrl, email, password);
      players.push({ email, token });
    } catch {
      break;
    }
  }

  if (players.length > 0) {
    return players;
  }

  if (!fallbackEmail) {
    throw new Error(
      'No load-test players found. Run: npm run migration:run',
    );
  }

  const token = await login(apiUrl, fallbackEmail, password);
  return [{ email: fallbackEmail, token }];
}

export function tokenForWorker(players, workerIndex) {
  return players[workerIndex % players.length].token;
}
