import { io, Socket } from 'socket.io-client';
import type { SpinResult, WheelTier } from '../../features/wheel/types';
import { getWheelSocketUrl } from './config';

export interface BackendPathStep {
  wheel: WheelTier;
  segmentIndex: number;
  label: string;
  stopAngle: number;
  type: 'multiplier' | 'next_wheel';
}

/** Authoritative round result from the server. */
export interface BackendWheelResult {
  roundId: string;
  path: BackendPathStep[];
  label: string;
  multiplier: number;
  wagerAmount: string;
  payoutAmount: string;
  balance: string;
  currency: string;
}

export class WheelSocketClient {
  private socket: Socket | null = null;
  private accessToken: string | null = null;

  connect(accessToken: string): void {
    this.accessToken = accessToken;

    if (this.socket?.connected) {
      return;
    }

    this.socket = io(getWheelSocketUrl(), {
      auth: { token: accessToken },
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to wheel gateway');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from wheel gateway');
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.accessToken = null;
  }

  async placeWager(wagerAmount: number): Promise<SpinResult> {
    if (!this.socket || !this.accessToken) {
      throw new Error('Socket not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Round timed out'));
      }, 20_000);

      const onResult = (result: BackendWheelResult) => {
        clearTimeout(timeout);
        this.socket?.off('wheel:result', onResult);
        this.socket?.off('wheel:error', onError);
        resolve(this.toSpinResult(result));
      };

      const onError = (error: { message?: string }) => {
        clearTimeout(timeout);
        this.socket?.off('wheel:result', onResult);
        this.socket?.off('wheel:error', onError);
        reject(new Error(error.message ?? 'Wheel round failed'));
      };

      this.socket!.once('wheel:result', onResult);
      this.socket!.once('wheel:error', onError);
      this.socket!.emit('wheel:spin', { wagerAmount });
    });
  }

  private toSpinResult(result: BackendWheelResult): SpinResult {
    return {
      path: result.path.map((step) => ({
        wheel: step.wheel,
        segmentIndex: step.segmentIndex,
        label: step.label,
        type: step.type,
        targetDeg: step.stopAngle,
      })),
      multiplier: result.multiplier,
      payoutAmount: parseFloat(result.payoutAmount),
      wagerAmount: parseFloat(result.wagerAmount),
      balance: parseFloat(result.balance),
      currency: result.currency,
      roundId: result.roundId,
      label: result.label,
    };
  }
}

export const wheelSocket = new WheelSocketClient();
