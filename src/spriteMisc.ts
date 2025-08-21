/**
 * Miscellaneous sprite utilities for TSL shader system
 * Contains cloud, horizon, restart, game over text, and star sprites
 */

import { Fn, float } from 'three/tsl';
import type { FnArguments } from './types.ts';
import { sampleSprite } from './spriteUtils.ts';

// Miscellaneous sprite coordinates (LDPI version from extract script)
export const MISC_SPRITES = {
  CLOUD: { x: 86, y: 2, width: 46, height: 14 },
  HORIZON: { x: 2, y: 54, width: 600, height: 12 },
  RESTART: { x: 2, y: 2, width: 36, height: 32 },
  TEXT_SPRITE: { x: 655, y: 2, width: 191, height: 11 }, // Contains "GAME OVER" text
  STAR: { x: 645, y: 2, width: 9, height: 9 }
};

export const spriteCloud = Fn(([spriteTexture, p, scale]: FnArguments) => {
  return sampleSprite(
    spriteTexture, p, scale, 
    float(MISC_SPRITES.CLOUD.x), 
    float(MISC_SPRITES.CLOUD.y), 
    float(MISC_SPRITES.CLOUD.width), 
    float(MISC_SPRITES.CLOUD.height)
  );
});

export const spriteHorizon = Fn(([spriteTexture, p, scale]: FnArguments) => {
  return sampleSprite(
    spriteTexture, p, scale, 
    float(MISC_SPRITES.HORIZON.x), 
    float(MISC_SPRITES.HORIZON.y), 
    float(MISC_SPRITES.HORIZON.width), 
    float(MISC_SPRITES.HORIZON.height)
  );
});

export const spriteRestart = Fn(([spriteTexture, p, scale]: FnArguments) => {
  return sampleSprite(
    spriteTexture, p, scale, 
    float(MISC_SPRITES.RESTART.x), 
    float(MISC_SPRITES.RESTART.y), 
    float(MISC_SPRITES.RESTART.width), 
    float(MISC_SPRITES.RESTART.height)
  );
});

export const spriteGameOver = Fn(([spriteTexture, p, scale]: FnArguments) => {
  return sampleSprite(
    spriteTexture, p, scale, 
    float(MISC_SPRITES.TEXT_SPRITE.x), 
    float(MISC_SPRITES.TEXT_SPRITE.y), 
    float(MISC_SPRITES.TEXT_SPRITE.width), 
    float(MISC_SPRITES.TEXT_SPRITE.height)
  );
});

export const spriteStar = Fn(([spriteTexture, p, scale]: FnArguments) => {
  return sampleSprite(
    spriteTexture, p, scale, 
    float(MISC_SPRITES.STAR.x), 
    float(MISC_SPRITES.STAR.y), 
    float(MISC_SPRITES.STAR.width), 
    float(MISC_SPRITES.STAR.height)
  );
});