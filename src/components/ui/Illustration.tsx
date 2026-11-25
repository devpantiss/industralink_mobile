import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useUiStore } from '../../store/uiStore';
import { ART, type ArtName, type ArtRole, type ArtShape } from './illustrations';

/** A small decorative drawing for empty screens, in the current theme's colours. */
export const Illustration: React.FC<{ name: ArtName; height?: number }> = ({ name, height = 112 }) => {
  const colors = useUiStore((s) => s.colors);
  const color: Record<ArtRole, string> = {
    blob: colors.primarySoft,
    card: colors.surface,
    line: colors.borderStrong,
    primary: colors.primary,
    accent: colors.accent,
    white: '#FFFFFF',
  };

  const paint = (shape: ArtShape) => ({
    fill: shape.fill ? color[shape.fill] : 'none',
    stroke: shape.stroke && color[shape.stroke],
    strokeWidth: shape.stroke ? (shape.width ?? 2) : undefined,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeDasharray: shape.dash,
    opacity: shape.opacity,
  });

  return (
    <Svg width={(height * 160) / 120} height={height} viewBox="0 0 160 120" accessible={false}>
      {ART[name].map((shape, index) =>
        shape.kind === 'circle' ? (
          <Circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} {...paint(shape)} />
        ) : shape.kind === 'rect' ? (
          <Rect key={index} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} {...paint(shape)} />
        ) : (
          <Path key={index} d={shape.d} {...paint(shape)} />
        ),
      )}
    </Svg>
  );
};
