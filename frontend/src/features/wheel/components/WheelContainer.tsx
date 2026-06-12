import React from 'react';
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

interface WheelContainerProps {
  innerRotation: number;
  middleRotation: number;
  bigRotation: number;
  activeWheel: 'small' | 'middle' | 'big';
  transitionTime: number;
  isSpinning?: boolean;
}

interface WheelRingProps {
  src: string;
  alt: string;
  size: string;
  zIndex: number;
  rotation: number;
  spinDuration: number;
  isActive: boolean;
  isSpinning: boolean;
}

function WheelRing({
  src,
  alt,
  size,
  zIndex,
  rotation,
  spinDuration,
  isActive,
  isSpinning,
}: WheelRingProps) {
  return (
    <WheelLayerAnchor $size={size} $zIndex={zIndex}>
      <WheelLayerSpin
        $rotation={rotation}
        $transitionTime={spinDuration}
        $isSpinning={isSpinning}
      >
        <WheelLayerImage src={src} alt={alt} $isActive={isActive} />
      </WheelLayerSpin>
    </WheelLayerAnchor>
  );
}

export const WheelContainer: React.FC<WheelContainerProps> = ({
  innerRotation,
  middleRotation,
  bigRotation,
  activeWheel,
  transitionTime,
  isSpinning = false,
}) => {
  const outerDuration = transitionTime * 1.08;
  const middleDuration = transitionTime;
  const innerDuration = transitionTime * 0.95;

  return (
    <StyledWheelContainer>
      <WheelPointer activeWheel={activeWheel} />
      <WheelGlow $isSpinning={isSpinning} />
      <WheelRing
        src={ring3}
        alt="Outer Wheel"
        size="100%"
        zIndex={1}
        rotation={bigRotation}
        spinDuration={outerDuration}
        isActive={activeWheel === 'big'}
        isSpinning={isSpinning}
      />
      <WheelRing
        src={ring2}
        alt="Middle Wheel"
        size="70%"
        zIndex={2}
        rotation={middleRotation}
        spinDuration={middleDuration}
        isActive={activeWheel === 'middle'}
        isSpinning={isSpinning}
      />
      <WheelRing
        src={ring1}
        alt="Inner Wheel"
        size="40%"
        zIndex={3}
        rotation={innerRotation}
        spinDuration={innerDuration}
        isActive={activeWheel === 'small'}
        isSpinning={isSpinning}
      />
    </StyledWheelContainer>
  );
};
