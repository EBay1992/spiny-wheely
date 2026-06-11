import React from 'react';
import {
  WheelContainer as StyledWheelContainer,
  WheelGlow,
  WheelLayer,
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
      <WheelLayer
        src={ring3}
        alt="Outer Wheel"
        $size="100%"
        $zIndex={1}
        $rotation={bigRotation}
        $transitionTime={outerDuration}
        $isActive={activeWheel === 'big'}
        $isSpinning={isSpinning}
      />
      <WheelLayer
        src={ring2}
        alt="Middle Wheel"
        $size="70%"
        $zIndex={2}
        $rotation={middleRotation}
        $transitionTime={middleDuration}
        $isActive={activeWheel === 'middle'}
        $isSpinning={isSpinning}
      />
      <WheelLayer
        src={ring1}
        alt="Inner Wheel"
        $size="40%"
        $zIndex={3}
        $rotation={innerRotation}
        $transitionTime={innerDuration}
        $isActive={activeWheel === 'small'}
        $isSpinning={isSpinning}
      />
    </StyledWheelContainer>
  );
};
