import React from 'react';
import { WheelContainer as StyledWheelContainer, WheelGlow, WheelLayer, WheelPointer } from './WheelStyles';
import ring1 from '../../../assets/wheels/Ring1Colorized.png';
import ring2 from '../../../assets/wheels/Ring2Colorized.png';
import ring3 from '../../../assets/wheels/Ring3Colorized.png';

interface WheelContainerProps {
  innerRotation: number;
  middleRotation: number;
  bigRotation: number;
  activeWheel: 'small' | 'middle' | 'big';
  transitionTime: number;
}

export const WheelContainer: React.FC<WheelContainerProps> = ({ innerRotation, middleRotation, bigRotation, activeWheel, transitionTime }) => {
  return (
    <StyledWheelContainer>
      <WheelPointer $activeWheel={activeWheel} />
      <WheelGlow />
      {/* Outer Ring - Wheel 3 (Big) */}
      <WheelLayer
        src={ring3}
        alt="Outer Wheel"
        $size="100%"
        $zIndex={1}
        $rotation={bigRotation}
        $transitionTime={transitionTime}
      />
      {/* Middle Ring - Wheel 2 (Middle) */}
      <WheelLayer
        src={ring2}
        alt="Middle Wheel"
        $size="70%"
        $zIndex={2}
        $rotation={middleRotation}
        $transitionTime={transitionTime}
      />
      {/* Inner Ring - Wheel 1 (Little) */}
      <WheelLayer
        src={ring1}
        alt="Inner Wheel"
        $size="40%"
        $zIndex={3}
        $rotation={innerRotation}
        $transitionTime={transitionTime}
      />
    </StyledWheelContainer>
  );
};

