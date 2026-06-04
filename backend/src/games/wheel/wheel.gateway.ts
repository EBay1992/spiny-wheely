import { Logger, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsPlayerGuard } from '../../auth/guards/ws-player.guard';
import { SpinDto } from './dto/spin.dto';
import { WheelService } from './wheel.service';
import { WheelWsExceptionFilter } from './wheel-ws-exception.filter';

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
  };
}

@UseFilters(WheelWsExceptionFilter)
@WebSocketGateway({
  namespace: '/wheel',
  cors: { origin: true, credentials: true },
})
export class WheelGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WheelGateway.name);

  constructor(private readonly wheelService: WheelService) {}

  handleConnection(client: AuthenticatedSocket): void {
    this.logger.debug(`Client connected: ${client.id}`);
    void this.emitPreview(client);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('wheel:preview')
  async handlePreview(@ConnectedSocket() client: Socket): Promise<void> {
    await this.emitPreview(client);
  }

  @SubscribeMessage('wheel:spin')
  @UseGuards(WsPlayerGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleSpin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SpinDto,
  ): Promise<void> {
    try {
      const playerId = client.data.userId;
      if (!playerId) {
        throw new WsException('Authentication required');
      }

      const result = await this.wheelService.spin(playerId, payload.wagerAmount);

      client.emit('wheel:result', result);
      this.server.emit('wheel:latest', {
        roundId: result.roundId,
        label: result.label,
        multiplier: result.multiplier,
      });
    } catch (error) {
      const message =
        error instanceof WsException
          ? String(error.message)
          : error instanceof Error
            ? error.message
            : 'Wheel spin failed';
      client.emit('wheel:error', { message });
    }
  }

  private async emitPreview(client: Socket): Promise<void> {
    try {
      const preview = await this.wheelService.getPreview();
      client.emit('wheel:preview', preview);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load wheel preview';
      client.emit('wheel:error', { message });
    }
  }
}
