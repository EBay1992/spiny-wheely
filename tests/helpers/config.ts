export const API_URL = process.env.API_URL ?? 'http://localhost:3000';
export const WHEEL_NAMESPACE = `${API_URL}/wheel`;

export const PLAYER_EMAIL =
  process.env.TEST_PLAYER_EMAIL ?? 'player@spinywheely.test';
export const PLAYER_PASSWORD =
  process.env.TEST_PLAYER_PASSWORD ?? 'player123';
export const ADMIN_EMAIL =
  process.env.TEST_ADMIN_EMAIL ?? 'admin@spinywheely.test';
export const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'admin123';
