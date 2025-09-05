/**
 * Cactus TSL utilities for TSL shader system
 */

import { Fn, select, float } from 'three/tsl';
import type { FnArguments } from '../types.ts';
import { sampleSprite } from './tslSpriteUtils.ts';

// Cactus sprite coordinates (LDPI version from extract script)
export const CACTUS_SMALL_SPRITES = {
  ONE_X: { x: 228, y: 2, width: 17, height: 35 },
  TWO_X: { x: 245, y: 2, width: 34, height: 35 },
  THREE_X: { x: 279, y: 2, width: 51, height: 35 }
};

export const CACTUS_LARGE_SPRITES = {
  ONE_X: { x: 332, y: 2, width: 25, height: 50 },
  TWO_X: { x: 357, y: 2, width: 50, height: 50 },
  THREE_X: { x: 407, y: 2, width: 75, height: 50 }
};

export const tslCactusSmall = Fn(([spriteTexture, p, scale, variant]: FnArguments) => {
  // Select sprite coordinates based on variant
  const coords = {
    x: select(variant.lessThan(0.5), float(CACTUS_SMALL_SPRITES.ONE_X.x),
      select(variant.lessThan(1.5), float(CACTUS_SMALL_SPRITES.TWO_X.x),
        float(CACTUS_SMALL_SPRITES.THREE_X.x))),

    y: float(CACTUS_SMALL_SPRITES.ONE_X.y), // Same Y for all variants

    width: select(variant.lessThan(0.5), float(CACTUS_SMALL_SPRITES.ONE_X.width),
      select(variant.lessThan(1.5), float(CACTUS_SMALL_SPRITES.TWO_X.width),
        float(CACTUS_SMALL_SPRITES.THREE_X.width))),

    height: float(CACTUS_SMALL_SPRITES.ONE_X.height) // Same height for all variants
  };

  return sampleSprite(spriteTexture, p, scale, coords.x, coords.y, coords.width, coords.height);
});

export const tslCactusLarge = Fn(([spriteTexture, p, scale, variant]: FnArguments) => {
  // Select sprite coordinates based on variant
  const coords = {
    x: select(variant.lessThan(0.5), float(CACTUS_LARGE_SPRITES.ONE_X.x),
      select(variant.lessThan(1.5), float(CACTUS_LARGE_SPRITES.TWO_X.x),
        float(CACTUS_LARGE_SPRITES.THREE_X.x))),

    y: float(CACTUS_LARGE_SPRITES.ONE_X.y), // Same Y for all variants

    width: select(variant.lessThan(0.5), float(CACTUS_LARGE_SPRITES.ONE_X.width),
      select(variant.lessThan(1.5), float(CACTUS_LARGE_SPRITES.TWO_X.width),
        float(CACTUS_LARGE_SPRITES.THREE_X.width))),

    height: float(CACTUS_LARGE_SPRITES.ONE_X.height) // Same height for all variants
  };

  return sampleSprite(spriteTexture, p, scale, coords.x, coords.y, coords.width, coords.height);
});
