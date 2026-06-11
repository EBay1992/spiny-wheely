import { useId } from 'react';
import styled from 'styled-components';

const PointerWrap = styled.div<{ $activeWheel: 'small' | 'middle' | 'big' }>`
  position: absolute;
  left: 50%;
  z-index: 10;
  width: clamp(22px, 5.5vw, 34px);
  height: clamp(30px, 7.5vw, 44px);
  transform: translate(-50%, -100%);
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.7));
  transition: top 0.85s cubic-bezier(0.34, 1.45, 0.64, 1);
  top: ${({ $activeWheel }) => {
    if ($activeWheel === 'small') return '30%';
    if ($activeWheel === 'middle') return '15%';
    return '0%';
  }};

  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
`;

interface WheelPointerProps {
  activeWheel: 'small' | 'middle' | 'big';
}

/** Single-piece wheel flapper — dark indigo body, gold rim for contrast on yellow segments. */
export function WheelPointer({ activeWheel }: WheelPointerProps) {
  const uid = useId().replace(/:/g, '');
  const fill = `pointerFill-${uid}`;

  return (
    <PointerWrap $activeWheel={activeWheel} aria-hidden>
      <svg viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={fill} x1="14" y1="2" x2="14" y2="38">
            <stop offset="0%" stopColor="#312e81" />
            <stop offset="55%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#0f0a1e" />
          </linearGradient>
        </defs>

        {/* Gold rim — reads on both gold and dark wheel segments */}
        <path
          d="M14 2 C19.5 2 22.5 5.5 21.5 10 L16.5 35 C15.8 37.5 14 38.5 14 38.5 C14 38.5 12.2 37.5 11.5 35 L6.5 10 C5.5 5.5 8.5 2 14 2 Z"
          fill="#fbbf24"
        />

        {/* Body */}
        <path
          d="M14 4.5 C18 4.5 20 7.2 19.2 10.5 L14.8 34 C14.4 35.8 14 36.5 14 36.5 C14 36.5 13.6 35.8 13.2 34 L8.8 10.5 C8 7.2 10 4.5 14 4.5 Z"
          fill={`url(#${fill})`}
        />

        {/* Center seam */}
        <line
          x1="14"
          y1="11"
          x2="14"
          y2="35"
          stroke="#a5b4fc"
          strokeWidth="0.6"
          strokeOpacity="0.35"
        />
      </svg>
    </PointerWrap>
  );
}
