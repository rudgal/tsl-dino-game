/**
 * Shared sprite utilities for TSL shader system
 */

import { Fn, texture, vec2, vec4, select, float } from 'three/tsl';
import type { FnArguments } from './types.ts';

// Sprite sheet dimensions (LDPI version)
export const SPRITE_SHEET_WIDTH = 1233 as const;
export const SPRITE_SHEET_HEIGHT = 68 as const;

// Normalization factor: 100 pixels = 1 Three.js unit
export const PIXELS_PER_UNIT = 100 as const;
export const PIXELS_PER_UNIT_F = float(PIXELS_PER_UNIT);

export const sampleSprite = Fn(([spriteTexture, p, scale, spriteX, spriteY, spriteWidth, spriteHeight]: FnArguments) => {
  // Convert sprite dimensions from pixels to world units (100px = 1 unit)
  const spriteWidthUnits = spriteWidth.div(PIXELS_PER_UNIT_F);
  const spriteHeightUnits = spriteHeight.div(PIXELS_PER_UNIT_F);

  // Scale the position (scale=1 means actual size, scale=2 means double size, etc.)
  const localP = p.div(scale);

  // Check if we're within the sprite bounds (in world units)
  const halfWidth = spriteWidthUnits.div(2.0);
  const halfHeight = spriteHeightUnits.div(2.0);

  const inBounds = localP.x.greaterThanEqual(halfWidth.negate())
    .and(localP.x.lessThanEqual(halfWidth))
    .and(localP.y.greaterThanEqual(halfHeight.negate()))
    .and(localP.y.lessThanEqual(halfHeight));

  // Convert local coordinates to UV coordinates within the sprite
  // Flip Y coordinate to fix upside-down rendering
  const spriteUV = vec2(
    localP.x.add(halfWidth).div(spriteWidthUnits),
    halfHeight.sub(localP.y).div(spriteHeightUnits)
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
