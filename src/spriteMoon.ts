/**
 * Moon sprite for night mode
 * Displays different moon phases based on night count
 */

import { array, float, Fn, int, mod, vec2, vec4 } from 'three/tsl';
import type { FnArguments } from './types.ts';
import { sampleSprite } from './spriteUtils.ts';

// Moon sprite coordinates (LDPI version from extract script)
export const MOON_SPRITES = {
  MOON: { x: 484, y: 2, width: 20, height: 40 }
};

export const MOON_SPEED = 0.08;
const MOON_PHASES_X_OFFSET = array([float(140), float(120), float(100), float(60), float(40), float(20), float(0)]);

export const spriteMoon = Fn(([spriteTexture, p, gameTime, nightData]: FnArguments) => {
  const nightProgress = nightData.x;
  const nightCount = nightData.y;

  // Select moon phase based on night count (cycles through 7 phases)
  const phaseIndex = mod(int(nightCount), 7);

  // Get phase offset from array using index
  const phaseOffset = MOON_PHASES_X_OFFSET.element(phaseIndex);

  // Moon scrolls from right to left, startPos is at right side of screen
  const moonX = float(3).sub(gameTime.mul(MOON_SPEED));
  // Wrap moon position when it goes off screen, wrap between -4 and 4
  const wrappedX = mod(moonX.add(4), 8).sub(4);

  // Moon Y position (fixed near top of screen)
  const moonY = float(0.3);

  // Calculate final position relative to p
  const moonPos = p.sub(vec2(wrappedX, moonY));

  // Sample the moon sprite with selected phase
  const moonSprite = sampleSprite(
    spriteTexture,
    moonPos,
    1.0,
    float(MOON_SPRITES.MOON.x).add(phaseOffset),
    float(MOON_SPRITES.MOON.y),
    float(MOON_SPRITES.MOON.width),
    float(MOON_SPRITES.MOON.height)
  );

  // Apply night progress as opacity
  return vec4(moonSprite.xyz, moonSprite.w.mul(nightProgress));
});
