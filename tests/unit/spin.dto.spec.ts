import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SpinDto } from '@backend/games/wheel/dto/spin.dto';

async function validateSpin(body: Record<string, unknown>) {
  const dto = plainToInstance(SpinDto, body);
  return validate(dto);
}

describe('SpinDto', () => {
  it('accepts a valid wager', async () => {
    const errors = await validateSpin({ wagerAmount: 10 });
    expect(errors).toHaveLength(0);
  });

  it('rejects wager below minimum', async () => {
    const errors = await validateSpin({ wagerAmount: 0.05 });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.min).toContain('0.10');
  });

  it('rejects wager above maximum', async () => {
    const errors = await validateSpin({ wagerAmount: 150 });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.max).toContain('100.00');
  });

  it('rejects non-numeric wager', async () => {
    const errors = await validateSpin({ wagerAmount: 'ten' });
    expect(errors.length).toBeGreaterThan(0);
  });
});
