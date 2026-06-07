import { io, Socket } from 'socket.io-client';
import { WHEEL_NAMESPACE } from './config';

export interface WheelSpinResult {
  roundId: string;
  path: Array<{
    wheel: string;
    segmentIndex: number;
    label: string;
    stopAngle: number;
    type: string;
  }>;
  label: string;
  multiplier: number;
  wagerAmount: string;
  payoutAmount: string;
  balance: string;
  currency: string;
}

export function connectWheel(token: string): Socket {
  return io(WHEEL_NAMESPACE, {
    auth: { token },
    transports: ['websocket'],
    forceNew: true,
  });
}

export function placeWager(
  token: string,
  wagerAmount: number,
  timeoutMs = 15_000,
): Promise<WheelSpinResult> {
  return new Promise((resolve, reject) => {
    const socket = connectWheel(token);
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error('Wheel round timed out'));
    }, timeoutMs);

    socket.on('connect', () => {
      socket.emit('wheel:spin', { wagerAmount });
    });

    socket.on('wheel:result', (result: WheelSpinResult) => {
      clearTimeout(timer);
      socket.close();
      resolve(result);
    });

    socket.on('wheel:error', (error: { message?: string }) => {
      clearTimeout(timer);
      socket.close();
      reject(new Error(error.message ?? 'Wheel error'));
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timer);
      socket.close();
      reject(error);
    });
  });
}

export function fetchWheelPreview(): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const socket = io(WHEEL_NAMESPACE, {
      transports: ['websocket'],
      forceNew: true,
    });
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error('Preview timed out'));
    }, 10_000);

    socket.on('connect', () => {
      socket.emit('wheel:preview');
    });

    socket.on('wheel:preview', (preview: Record<string, unknown>) => {
      clearTimeout(timer);
      socket.close();
      resolve(preview);
    });

    socket.on('wheel:error', (error: { message?: string }) => {
      clearTimeout(timer);
      socket.close();
      reject(new Error(error.message ?? 'Preview error'));
    });
  });
}
