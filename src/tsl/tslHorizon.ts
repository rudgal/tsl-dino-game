/**
 * Horizon TSL utilities for TSL shader system
 * Contains flat and bumpy terrain with repeating functionality
 */

import { float, Fn, mod, select, texture, vec2, vec4, floor, mix } from 'three/tsl';
import type { FnArguments } from '../types.ts';
import { PIXELS_PER_UNIT, SPRITE_SHEET_HEIGHT, SPRITE_SHEET_WIDTH } from './tslSpriteUtils.ts';

export const HORIZON_WIDTH = 600 as const;
export const HORIZON_HEIGHT = 12 as const;

// Horizon sprite coordinates (LDPI version from original Chrome game)
export const HORIZON_SPRITES = {
  HORIZON_FLAT: { x: 2, y: 54, width: HORIZON_WIDTH, height: HORIZON_HEIGHT }, // Flat terrain
  HORIZON_BUMPY: { x: 602, y: 54, width: HORIZON_WIDTH, height: HORIZON_HEIGHT }, // Bumpy terrain
} as const;

// Precomputed dimensions in world units (100px = 1 unit)
export const HORIZON_WIDTH_UNITS = HORIZON_SPRITES.HORIZON_BUMPY.width / PIXELS_PER_UNIT; // 6 units
export const HORIZON_HEIGHT_UNITS = HORIZON_SPRITES.HORIZON_BUMPY.height / PIXELS_PER_UNIT; // 0.12 units

export const tslHorizonRepeating = Fn(([spriteTexture, p, scale]: FnArguments) => {
  // Use precomputed constants
  const spriteWidthUnits = float(HORIZON_WIDTH_UNITS);
  const spriteHeightUnits = float(HORIZON_HEIGHT_UNITS);
  const halfWidthUnits = float(HORIZON_WIDTH_UNITS / 2);
  const halfHeightUnits = float(HORIZON_HEIGHT_UNITS / 2);

  // Scale the position (scale=1 means actual size, scale=2 means double size, etc.)
  const localP = p.div(scale);

  // Create repeating pattern by using modulo on X coordinate
  // This makes the texture tile horizontally in world units
  const repeatingX = mod(localP.x.add(halfWidthUnits), spriteWidthUnits).sub(halfWidthUnits);

  // Determine which segment we're in (even segments = flat, odd segments = bumpy)
  const segmentIndex = floor(localP.x.add(halfWidthUnits).div(spriteWidthUnits));
  const isOddSegment = mod(segmentIndex, float(2));

  // Select sprite X coordinate based on segment (flat terrain at x=2, bumpy at x=602)
  const spriteX = mix(
    float(HORIZON_SPRITES.HORIZON_FLAT.x),
    float(HORIZON_SPRITES.HORIZON_BUMPY.x),
    isOddSegment
  );

  // Check if we're within the sprite bounds (Y only, since X repeats infinitely)
  const inBoundsY = localP.y.greaterThanEqual(halfHeightUnits.negate())
    .and(localP.y.lessThanEqual(halfHeightUnits));

  // Calculate UV coordinates for the repeating sprite (normalized 0-1)
  const spriteUV = vec2(
    repeatingX.add(halfWidthUnits).div(spriteWidthUnits),
    halfHeightUnits.sub(localP.y).div(spriteHeightUnits)
  );

  // Map to texture coordinates in the sprite sheet
  const textureUV = vec2(
    spriteX.add(spriteUV.x.mul(float(HORIZON_WIDTH))).div(SPRITE_SHEET_WIDTH),
    float(1.0).sub(float(HORIZON_SPRITES.HORIZON_FLAT.y).add(spriteUV.y.mul(float(HORIZON_HEIGHT))).div(SPRITE_SHEET_HEIGHT))
  );

  const texelColor = texture(spriteTexture, textureUV);
  return select(inBoundsY, texelColor, vec4(0, 0, 0, 0));
});
