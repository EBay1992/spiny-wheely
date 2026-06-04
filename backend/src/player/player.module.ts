import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BetSession } from '../database/entities/bet-session.entity';
import { User } from '../database/entities/user.entity';
import { WalletModule } from '../wallet/wallet.module';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';

@Module({
  imports: [
    AuthModule,
    WalletModule,
    TypeOrmModule.forFeature([User, BetSession]),
  ],
  controllers: [PlayerController],
  providers: [PlayerService],
})
export class PlayerModule {}
