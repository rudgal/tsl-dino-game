/**
 * Miscellaneous sprite utilities for TSL shader system
 * Contains cloud, horizon, restart, game over text, and star sprites
 */

import { Fn, float, mod, vec4, vec2, texture, select } from 'three/tsl';
import type { FnArguments } from './types.ts';
import { sampleSprite, SPRITE_SHEET_WIDTH, SPRITE_SHEET_HEIGHT } from './spriteUtils.ts';

// Miscellaneous sprite coordinates (LDPI version from original Chrome game)
export const MISC_SPRITES = {
  CLOUD: { x: 86, y: 2, width: 46, height: 14 },
  HORIZON_FLAT: { x: 2, y: 54, width: 600, height: 12 }, // Flat terrain
  HORIZON_BUMPY: { x: 602, y: 54, width: 600, height: 12 }, // Bumpy terrain (offset by 600px)
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

export const spriteHorizonRepeating = Fn(([spriteTexture, p, scale]: FnArguments) => {
  // Use bumpy horizon for testing
  const spriteWidth = float(MISC_SPRITES.HORIZON_BUMPY.width);
  const spriteHeight = float(MISC_SPRITES.HORIZON_BUMPY.height);
  
  // Scale the position
  const localP = p.div(scale);
  
  // Create repeating pattern by using modulo on X coordinate
  // This makes the texture tile horizontally
  const repeatingX = mod(localP.x.add(spriteWidth.div(2.0)), spriteWidth).sub(spriteWidth.div(2.0));
  
  // Now use the standard sprite sampling but with the repeating X position
  const halfHeight = spriteHeight.div(2.0);
  
  // Check if we're within the sprite bounds (Y only, since X repeats infinitely)
  const inBoundsY = localP.y.greaterThanEqual(halfHeight.negate())
    .and(localP.y.lessThanEqual(halfHeight));
  
  // Calculate UV coordinates for the repeating sprite
  const spriteUV = vec2(
    repeatingX.add(spriteWidth.div(2.0)).div(spriteWidth),
    halfHeight.sub(localP.y).div(spriteHeight)
  );
  
  // Map to texture coordinates using the constants
  const textureUV = vec2(
    float(MISC_SPRITES.HORIZON_BUMPY.x).add(spriteUV.x.mul(spriteWidth)).div(SPRITE_SHEET_WIDTH),
    float(1.0).sub(float(MISC_SPRITES.HORIZON_BUMPY.y).add(spriteUV.y.mul(spriteHeight)).div(SPRITE_SHEET_HEIGHT))
  );
  
  const texelColor = texture(spriteTexture, textureUV);
  return select(inBoundsY, texelColor, vec4(0, 0, 0, 0));
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
