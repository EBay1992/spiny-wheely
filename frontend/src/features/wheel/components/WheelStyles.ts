import styled, { keyframes } from 'styled-components';

export const FeatureContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100dvh - 5rem);
  width: 100%;
  padding: clamp(10px, 3vw, 20px) 0;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
`;

export const Title = styled.h1`
  font-size: clamp(1.8rem, 5vw, 2.5rem);
  font-weight: 700;
  margin-bottom: clamp(1rem, 3vw, 2rem);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 20px rgba(165, 180, 252, 0.2);
`;

export const WheelContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 480px;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    margin-bottom: 2rem;
    max-width: 90vw;
  }
`;

const wheelAuraSpin = `
  @keyframes wheelAuraSpin {
    0%, 100% {
      opacity: 0.55;
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.06);
    }
  }
`;

const wheelAuraIdle = `
  @keyframes wheelAuraIdle {
    0%, 100% {
      opacity: 0.45;
      transform: translate(-50%, -50%) scale(0.98);
    }
    50% {
      opacity: 0.7;
      transform: translate(-50%, -50%) scale(1.02);
    }
  }
`;

export const WheelGlow = styled.div<{ $isSpinning?: boolean }>`
  ${wheelAuraSpin}
  ${wheelAuraIdle}

  position: absolute;
  top: 50%;
  left: 50%;
  width: 115%;
  height: 115%;
  background: radial-gradient(
    circle,
    rgba(251, 191, 36, 0.12) 0%,
    rgba(165, 180, 252, 0.2) 35%,
    rgba(99, 102, 241, 0.1) 55%,
    transparent 72%
  );
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: ${({ $isSpinning }) =>
    $isSpinning ? 'wheelAuraSpin 1.2s ease-in-out infinite' : 'wheelAuraIdle 4s ease-in-out infinite'};
`;

/** Fixed center anchor — inset + auto margins, no rotate/scale here. */
export const WheelLayerAnchor = styled.div<{
  $size: string;
  $zIndex: number;
  $interactive?: boolean;
}>`
  position: absolute;
  inset: 0;
  margin: auto;
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  z-index: ${({ $zIndex }) => $zIndex};
  pointer-events: ${({ $interactive }) => ($interactive ? 'auto' : 'none')};
`;

/** Spin only — long easing matches wheel deceleration. */
export const WheelLayerSpin = styled.div<{
  $rotation: number;
  $transitionTime: number;
  $isSpinning?: boolean;
}>`
  width: 100%;
  height: 100%;
  transform: rotate(${({ $rotation }) => $rotation}deg);
  transform-origin: center center;
  transition: transform ${({ $transitionTime }) => $transitionTime}s
    cubic-bezier(0.08, 0.82, 0.12, 1);
  will-change: ${({ $isSpinning }) => ($isSpinning ? 'transform' : 'auto')};
`;

/** Thrust highlight — short scale synced across all rings. */
export const WheelLayerImage = styled.img<{ $isActive?: boolean }>`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center center;
  transform: scale(${({ $isActive }) => ($isActive ? 1.03 : 1)});
  transform-origin: center center;
  transition:
    transform 0.85s cubic-bezier(0.34, 1.45, 0.64, 1),
    filter 0.45s ease,
    opacity 0.45s ease;
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.5))
    drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35))
    brightness(${({ $isActive }) => ($isActive ? 1.12 : 0.9)})
    saturate(${({ $isActive }) => ($isActive ? 1.15 : 1)});
  opacity: ${({ $isActive }) => ($isActive ? 1 : 0.88)};
  user-select: none;
`;

export const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  z-index: 2;
`;

export const SpinButton = styled.button`
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(168, 85, 247, 0.9));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px 0 rgba(99, 102, 241, 0.5),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
  color: #ffffff;
  font-size: clamp(1.1rem, 4vw, 1.3rem);
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  padding: clamp(14px, 4vw, 18px) clamp(30px, 8vw, 50px);
  border-radius: 50px;
  cursor: pointer;
  outline: none;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    transition: 0.6s;
  }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(99, 102, 241, 1), rgba(168, 85, 247, 1));
    border-color: rgba(255, 255, 255, 0.6);
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 15px 40px 0 rgba(168, 85, 247, 0.6),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.5);
    
    &::before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(1px) scale(0.98);
    box-shadow: 0 6px 20px 0 rgba(99, 102, 241, 0.4);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    border-color: rgba(255, 255, 255, 0.1);
    &::before {
      display: none;
    }
  }
`;

const winPulse = keyframes`
  0%, 100% {
    text-shadow: 0 0 12px rgba(134, 239, 172, 0.35);
  }
  50% {
    text-shadow: 0 0 22px rgba(251, 191, 36, 0.65);
  }
`;

export const StatusText = styled.p<{ $isError?: boolean; $isWin?: boolean }>`
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
  max-width: 420px;
  line-height: 1.45;
  min-height: 1.2rem;
  margin: 0;
  padding: 0 0.5rem;
  color: ${({ $isError, $isWin }) =>
    $isError ? '#fca5a5' : $isWin ? '#86efac' : '#a5b4fc'};
  letter-spacing: ${({ $isError, $isWin }) =>
    $isError ? 'normal' : $isWin ? '0.06em' : '1px'};
  text-transform: ${({ $isError }) => ($isError ? 'none' : 'uppercase')};
  opacity: ${({ $isError, $isWin }) => ($isError || $isWin ? 1 : 0.8)};
  animation: ${({ $isWin }) => ($isWin ? winPulse : 'none')} 1.4s ease-in-out infinite;
`;

export const GamePanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.75rem;
  margin-bottom: 10px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: clamp(10px, 3vw, 15px) clamp(15px, 5vw, 25px);
  border-radius: 20px;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;
`;

export const GamePanelTopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
`;

export const BalanceStat = styled.div`
  flex-shrink: 0;
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;

  span {
    color: #a5b4fc;
  }
`;

export const GamePanelFooter = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

export const ActionButton = styled.button<{ $active?: boolean }>`
  background: ${props => props.$active ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.8), rgba(244, 63, 94, 0.8))' : 'rgba(255, 255, 255, 0.1)'};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid ${props => props.$active ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'};
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.$active ? '0 4px 15px rgba(236, 72, 153, 0.4)' : '0 4px 15px rgba(0, 0, 0, 0.2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;

  &:hover:not(:disabled) {
    background: ${props => props.$active ? 'linear-gradient(135deg, rgba(236, 72, 153, 1), rgba(244, 63, 94, 1))' : 'rgba(255, 255, 255, 0.2)'};
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-2px) scale(1.02);
    box-shadow: ${props => props.$active ? '0 6px 20px rgba(236, 72, 153, 0.6)' : '0 6px 20px rgba(99, 102, 241, 0.4)'};
  }

  &:active:not(:disabled) {
    transform: translateY(1px) scale(0.98);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    filter: grayscale(100%);
  }
`;

