/**
 * Game Over TSL utilities for TSL shader system
 * Contains restart button and "GAME OVER" text
 */

import { float, Fn } from 'three/tsl';
import type { FnArguments } from '../types.ts';
import { sampleSprite } from './tslSpriteUtils.ts';

// Game Over sprite coordinates (LDPI version from original Chrome game)
export const GAME_OVER_SPRITES = {
  RESTART: { x: 2, y: 2, width: 36, height: 32 },
  TEXT_SPRITE: { x: 655, y: 15, width: 191, height: 11 }, // Contains "GAME OVER" text (LDPI - corrected Y coordinate)
} as const;

export const tslRestart = Fn(([spriteTexture, p, scale]: FnArguments) => {
  return sampleSprite(
    spriteTexture, p, scale,
    float(GAME_OVER_SPRITES.RESTART.x),
    float(GAME_OVER_SPRITES.RESTART.y),
    float(GAME_OVER_SPRITES.RESTART.width),
    float(GAME_OVER_SPRITES.RESTART.height)
  );
});

export const tslGameOver = Fn(([spriteTexture, p, scale]: FnArguments) => {
  return sampleSprite(
    spriteTexture, p, scale,
    float(GAME_OVER_SPRITES.TEXT_SPRITE.x),
    float(GAME_OVER_SPRITES.TEXT_SPRITE.y),
    float(GAME_OVER_SPRITES.TEXT_SPRITE.width),
    float(GAME_OVER_SPRITES.TEXT_SPRITE.height)
  );
});
