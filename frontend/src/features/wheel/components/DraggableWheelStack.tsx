import React, { useCallback, useRef, useState } from 'react';
import {
  WheelContainer as StyledWheelContainer,
  WheelGlow,
  WheelLayerAnchor,
  WheelLayerImage,
  WheelLayerSpin,
} from './WheelStyles';
import { WheelPointer } from './WheelPointer';
import ring1 from '../../../assets/wheels/Ring1Colorized.png';
import ring2 from '../../../assets/wheels/Ring2Colorized.png';
import ring3 from '../../../assets/wheels/Ring3Colorized.png';
import type { WheelTier } from '../types';

interface DraggableWheelStackProps {
  innerRotation: number;
  middleRotation: number;
  bigRotation: number;
  dragTier: WheelTier;
  onRotationChange: (tier: WheelTier, rotation: number) => void;
}

interface WheelRingProps {
  src: string;
  alt: string;
  size: string;
  zIndex: number;
  rotation: number;
  tier: WheelTier;
  isDragTarget: boolean;
  isDragging: boolean;
  onPointerDown: (tier: WheelTier, event: React.PointerEvent) => void;
}

function WheelRing({
  src,
  alt,
  size,
  zIndex,
  rotation,
  tier,
  isDragTarget,
  isDragging,
  onPointerDown,
}: WheelRingProps) {
  return (
    <WheelLayerAnchor
      $size={size}
      $zIndex={zIndex}
      $interactive={isDragTarget}
      style={{
        cursor: isDragTarget ? (isDragging ? 'grabbing' : 'grab') : 'default',
        touchAction: isDragTarget ? 'none' : 'auto',
      }}
      onPointerDown={isDragTarget ? (event) => onPointerDown(tier, event) : undefined}
    >
      <WheelLayerSpin
        $rotation={rotation}
        $transitionTime={isDragging ? 0 : 0.2}
        $isSpinning={isDragging}
      >
        <WheelLayerImage src={src} alt={alt} $isActive={isDragTarget} draggable={false} />
      </WheelLayerSpin>
    </WheelLayerAnchor>
  );
}

function angleFromCenter(clientX: number, clientY: number, rect: DOMRect): number {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const radians = Math.atan2(clientY - cy, clientX - cx);
  return (radians * 180) / Math.PI + 90;
}

export const DraggableWheelStack: React.FC<DraggableWheelStackProps> = ({
  innerRotation,
  middleRotation,
  bigRotation,
  dragTier,
  onRotationChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    tier: WheelTier;
    startPointerAngle: number;
    startRotation: number;
  } | null>(null);
  const [draggingTier, setDraggingTier] = useState<WheelTier | null>(null);

  const rotationForTier = useCallback(
    (tier: WheelTier): number => {
      if (tier === 'small') return innerRotation;
      if (tier === 'middle') return middleRotation;
      return bigRotation;
    },
    [innerRotation, middleRotation, bigRotation],
  );

  const handlePointerDown = useCallback(
    (tier: WheelTier, event: React.PointerEvent) => {
      if (!containerRef.current) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);

      const rect = containerRef.current.getBoundingClientRect();
      dragStateRef.current = {
        tier,
        startPointerAngle: angleFromCenter(event.clientX, event.clientY, rect),
        startRotation: rotationForTier(tier),
      };
      setDraggingTier(tier);
    },
    [rotationForTier],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const pointerAngle = angleFromCenter(event.clientX, event.clientY, rect);
      const delta = pointerAngle - drag.startPointerAngle;
      onRotationChange(drag.tier, drag.startRotation + delta);
    },
    [onRotationChange],
  );

  const endDrag = useCallback((event: React.PointerEvent) => {
    if (!dragStateRef.current) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
    setDraggingTier(null);
  }, []);

  return (
    <StyledWheelContainer
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <WheelPointer activeWheel={dragTier} />
      <WheelGlow $isSpinning={draggingTier !== null} />
      <WheelRing
        src={ring3}
        alt="Outer Wheel"
        size="100%"
        zIndex={dragTier === 'big' ? 4 : 1}
        rotation={bigRotation}
        tier="big"
        isDragTarget={dragTier === 'big'}
        isDragging={draggingTier === 'big'}
        onPointerDown={handlePointerDown}
      />
      <WheelRing
        src={ring2}
        alt="Middle Wheel"
        size="70%"
        zIndex={dragTier === 'middle' ? 4 : 2}
        rotation={middleRotation}
        tier="middle"
        isDragTarget={dragTier === 'middle'}
        isDragging={draggingTier === 'middle'}
        onPointerDown={handlePointerDown}
      />
      <WheelRing
        src={ring1}
        alt="Inner Wheel"
        size="40%"
        zIndex={dragTier === 'small' ? 4 : 3}
        rotation={innerRotation}
        tier="small"
        isDragTarget={dragTier === 'small'}
        isDragging={draggingTier === 'small'}
        onPointerDown={handlePointerDown}
      />
    </StyledWheelContainer>
  );
};
