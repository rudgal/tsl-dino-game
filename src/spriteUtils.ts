/**
 * Shared sprite utilities for TSL shader system
 */

import { Fn, texture, vec2, vec4, select, float } from 'three/tsl';
import type { FnArguments } from './types.ts';

// Sprite sheet dimensions (LDPI version)
export const SPRITE_SHEET_WIDTH = 1233;
export const SPRITE_SHEET_HEIGHT = 68;

export const sampleSprite = Fn(([spriteTexture, p, scale, spriteX, spriteY, spriteWidth, spriteHeight]: FnArguments) => {
  // Convert world position to sprite local coordinates
  // Scale the position to match sprite dimensions
  const localP = p.div(scale);

  // Check if we're within the sprite bounds
  const halfWidth = spriteWidth.div(2.0);
  const halfHeight = spriteHeight.div(2.0);

  const inBounds = localP.x.greaterThanEqual(halfWidth.negate())
    .and(localP.x.lessThanEqual(halfWidth))
    .and(localP.y.greaterThanEqual(halfHeight.negate()))
    .and(localP.y.lessThanEqual(halfHeight));

  // Convert local coordinates to UV coordinates within the sprite
  // Flip Y coordinate to fix upside-down rendering
  const spriteUV = vec2(
    localP.x.add(halfWidth).div(spriteWidth),
    halfHeight.sub(localP.y).div(spriteHeight)
  );

  // Convert sprite UV to texture UV (accounting for sprite position in sheet)
  const textureUV = vec2(
    spriteX.add(spriteUV.x.mul(spriteWidth)).div(SPRITE_SHEET_WIDTH),
    // Flip Y coordinate for texture sampling
    float(1.0).sub(spriteY.add(spriteUV.y.mul(spriteHeight)).div(SPRITE_SHEET_HEIGHT))
  );

  // Sample the texture
  const texelColor = texture(spriteTexture, textureUV);

  // Return color only if within bounds, otherwise transparent
  return select(inBounds, texelColor, vec4(0, 0, 0, 0));
});
