/**
 * Cradient background shader
 * Creates a dynamic gradient background with multiple colors
 */

import { Fn, mix, time, uv } from 'three/tsl';
import type { uniform } from 'three/tsl';

export const tslBackground = (uniforms: {
  bottomLeft: ReturnType<typeof uniform>;
  bottomRight: ReturnType<typeof uniform>;
  topLeft: ReturnType<typeof uniform>;
  topRight: ReturnType<typeof uniform>;
}) => Fn(() => {
  const uvCoords = uv();
  const t = time.mul(0.3);

  const bottomLeft = uniforms.bottomLeft;
  const bottomRight = uniforms.bottomRight;
  const topLeft = uniforms.topLeft;
  const topRight = uniforms.topRight;

  // interpolate gradient
  const bottomRow = mix(bottomLeft, bottomRight, uvCoords.x);
  const topRow = mix(topLeft, topRight, uvCoords.x);
  const baseColor = mix(bottomRow, topRow, uvCoords.y);

  // time-based brightness variation
  const brightness = t.sin().mul(0.3).add(1.1);

  return baseColor.mul(brightness);
});
