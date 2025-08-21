/**
 * Moon sprite utilities for TSL shader system
 */

import { Fn, float } from 'three/tsl';
import type { FnArguments } from './types.ts';
import { sampleSprite } from './spriteUtils.ts';

// Moon sprite coordinates (LDPI version from extract script)
export const MOON_SPRITES = {
  MOON: { x: 484, y: 2, width: 20, height: 40 }
};

export const spriteMoon = Fn(([spriteTexture, p, scale]: FnArguments) => {
  return sampleSprite(
    spriteTexture, p, scale, 
    float(MOON_SPRITES.MOON.x), 
    float(MOON_SPRITES.MOON.y), 
    float(MOON_SPRITES.MOON.width), 
    float(MOON_SPRITES.MOON.height)
  );
});