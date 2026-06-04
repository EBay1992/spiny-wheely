import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class WsPlayerGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const token = client.handshake.auth?.token as string | undefined;

    if (!token) {
      throw new WsException('Authentication required');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      if (payload.role !== UserRole.PLAYER) {
        throw new WsException('Player role required');
      }

      client.data.userId = payload.sub;
      return true;
    } catch {
      throw new WsException('Invalid or expired token');
    }
  }
}
