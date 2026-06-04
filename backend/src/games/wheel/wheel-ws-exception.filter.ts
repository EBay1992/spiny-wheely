import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WheelWsExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();
    const message = this.resolveMessage(exception);
    client.emit('wheel:error', { message });
  }

  private resolveMessage(exception: unknown): string {
    if (exception instanceof WsException) {
      const error = exception.getError();
      return typeof error === 'string' ? error : JSON.stringify(error);
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const msg = (response as { message: string | string[] }).message;
        return Array.isArray(msg) ? msg.join(', ') : msg;
      }
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return 'Wheel spin failed';
  }
}
