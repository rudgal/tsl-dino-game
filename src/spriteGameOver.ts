/**
 * Game Over UI sprite utilities for TSL shader system
 * Contains restart button and "GAME OVER" text sprites
 */

import { float, Fn } from 'three/tsl';
import type { FnArguments } from './types.ts';
import { sampleSprite } from './spriteUtils.ts';

// Game Over sprite coordinates (LDPI version from original Chrome game)
export const GAME_OVER_SPRITES = {
  RESTART: { x: 2, y: 2, width: 36, height: 32 },
  TEXT: { x: 655, y: 15, width: 191, height: 11 },
} as const;

export const spriteRestart = Fn(([spriteTexture, p, scale]: FnArguments) => {
  return sampleSprite(
    spriteTexture, p, scale,
    float(GAME_OVER_SPRITES.RESTART.x),
    float(GAME_OVER_SPRITES.RESTART.y),
    float(GAME_OVER_SPRITES.RESTART.width),
    float(GAME_OVER_SPRITES.RESTART.height)
  );
});

export const spriteGameOver = Fn(([spriteTexture, p, scale]: FnArguments) => {
  return sampleSprite(
    spriteTexture, p, scale,
    float(GAME_OVER_SPRITES.TEXT.x),
    float(GAME_OVER_SPRITES.TEXT.y),
    float(GAME_OVER_SPRITES.TEXT.width),
    float(GAME_OVER_SPRITES.TEXT.height)
  );
});
