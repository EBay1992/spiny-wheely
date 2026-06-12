import confetti from 'canvas-confetti';

const WIN_COLORS = ['#fbbf24', '#a5b4fc', '#86efac', '#f472b6', '#ffffff'];

let confettiInstance: ReturnType<typeof confetti.create> | null = null;

function getConfetti() {
  if (typeof document === 'undefined') {
    return confetti;
  }

  if (!confettiInstance) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);
    confettiInstance = confetti.create(canvas, { resize: true, useWorker: false });
  }

  return confettiInstance;
}

/** Burst confetti when a wheel round pays out. */
export function celebrateWin(payoutAmount: number, wagerAmount: number): void {
  const fire = getConfetti();
  const isBigWin = payoutAmount >= wagerAmount * 3;
  const baseCount = isBigWin ? 140 : 90;

  fire({
    particleCount: baseCount,
    spread: isBigWin ? 90 : 72,
    startVelocity: isBigWin ? 48 : 38,
    origin: { y: 0.55 },
    colors: WIN_COLORS,
    zIndex: 99999,
    disableForReducedMotion: false,
  });

  const end = Date.now() + (isBigWin ? 2800 : 2000);

  const frame = (): void => {
    fire({
      particleCount: isBigWin ? 4 : 2,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: WIN_COLORS,
      zIndex: 99999,
      disableForReducedMotion: false,
    });
    fire({
      particleCount: isBigWin ? 4 : 2,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: WIN_COLORS,
      zIndex: 99999,
      disableForReducedMotion: false,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}
