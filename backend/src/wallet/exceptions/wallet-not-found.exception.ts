import { NotFoundException } from '@nestjs/common';

export class WalletNotFoundException extends NotFoundException {
  constructor(userId: string) {
    super(`Wallet not found for user ${userId}`);
  }
}
