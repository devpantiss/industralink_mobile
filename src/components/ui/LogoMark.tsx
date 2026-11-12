import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';

interface LogoMarkProps {
  size?: number;
}

/**
 * Exact brand mark from web dashboard:
 * A cobalt tile with a white "L" (the link between worker and site)
 * and a safety-yellow accent block.
 */
export const LogoMark: React.FC<LogoMarkProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect width="32" height="32" rx="9" fill="#2454E6" />
      <Path d="M9 8h4.2v12.2H23V24H9z" fill="#FFFFFF" />
      <Rect x="17" y="8" width="6" height="6" rx="1.2" fill="#F2B418" />
    </Svg>
  );
};

