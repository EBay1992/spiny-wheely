import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BetSession } from '../database/entities/bet-session.entity';
import { BetSessionListener } from './bet-session.listener';

@Module({
  imports: [TypeOrmModule.forFeature([BetSession])],
  providers: [BetSessionListener],
})
export class BetSessionModule {}
