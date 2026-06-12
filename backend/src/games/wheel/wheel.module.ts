import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { WheelTestRun } from '../../database/entities/wheel-test-run.entity';
import { GameConfigModule } from '../../game-config/game-config.module';
import { WalletModule } from '../../wallet/wallet.module';
import { WsPlayerGuard } from '../../auth/guards/ws-player.guard';
import { WheelGateway } from './wheel.gateway';
import { WheelWsExceptionFilter } from './wheel-ws-exception.filter';
import { WheelService } from './wheel.service';

@Module({
  imports: [
    AuthModule,
    GameConfigModule,
    WalletModule,
    TypeOrmModule.forFeature([WheelTestRun]),
  ],
  providers: [WheelService, WheelGateway, WsPlayerGuard, WheelWsExceptionFilter],
  exports: [WheelService],
})
export class WheelModule {}
