import styled, { keyframes } from 'styled-components';

const flashIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.92);
  }
  18% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.04);
  }
`;

const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 40px rgba(251, 191, 36, 0.35);
  }
  50% {
    box-shadow: 0 0 80px rgba(251, 191, 36, 0.65);
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 99998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    circle at 50% 45%,
    rgba(251, 191, 36, 0.22) 0%,
    rgba(168, 85, 247, 0.12) 35%,
    transparent 65%
  );
  animation: ${flashIn} 2.8s ease-out forwards;
`;

const Banner = styled.div`
  padding: 1.25rem 2rem;
  border-radius: 1rem;
  border: 1px solid rgba(251, 191, 36, 0.55);
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  text-align: center;
  animation: ${glowPulse} 1.2s ease-in-out infinite;
`;

const Headline = styled.p`
  margin: 0;
  font-size: clamp(1.6rem, 6vw, 2.4rem);
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #fde68a 0%, #fbbf24 45%, #ffffff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Amount = styled.p`
  margin: 0.35rem 0 0;
  font-size: clamp(1.1rem, 4vw, 1.5rem);
  font-weight: 700;
  color: #86efac;
`;

interface WinCelebrationProps {
  netProfit: number;
}

export function WinCelebration({ netProfit }: WinCelebrationProps) {
  return (
    <Overlay role="status" aria-live="polite">
      <Banner>
        <Headline>You won!</Headline>
        <Amount>+${netProfit.toFixed(2)}</Amount>
      </Banner>
    </Overlay>
  );
}
