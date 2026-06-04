import { BadRequestException } from '@nestjs/common';

export class InsufficientBalanceException extends BadRequestException {
  constructor(userId: string, requested: string, available: string) {
    super(
      `Insufficient balance for user ${userId}: requested ${requested}, available ${available}`,
    );
  }
}
