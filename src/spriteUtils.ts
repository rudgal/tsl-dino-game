/**
 * Sprite utilities for TSL shader system
 */

import { Fn, texture, vec2, vec4, select, float } from 'three/tsl';
import type { FnArguments } from './types.ts';

// Sprite sheet dimensions (LDPI version)
const SPRITE_SHEET_WIDTH = 1233;
const SPRITE_SHEET_HEIGHT = 68;

// T-Rex sprite coordinates (LDPI version from extract script)
export const TREX_SPRITES = {
  WAITING_1: { x: 848, y: 2, width: 44, height: 47 },
  WAITING_2: { x: 892, y: 2, width: 44, height: 47 },
  RUNNING_1: { x: 936, y: 2, width: 44, height: 47 },
  RUNNING_2: { x: 980, y: 2, width: 44, height: 47 },
  JUMPING: { x: 848, y: 2, width: 44, height: 47 },
  DUCKING_1: { x: 1112, y: 2, width: 59, height: 47 },
  DUCKING_2: { x: 1171, y: 2, width: 58, height: 47 },
  CRASHED: { x: 1068, y: 2, width: 43, height: 47 }
};

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

export const spriteTRex = Fn(([spriteTexture, p, scale, frame]: FnArguments) => {
  // Select sprite coordinates based on frame
  // Default to WAITING_1 (frame 0)
  const coords = {
    x: select(frame.lessThan(0.5), float(TREX_SPRITES.WAITING_1.x),
      select(frame.lessThan(1.5), float(TREX_SPRITES.RUNNING_1.x),
        select(frame.lessThan(2.5), float(TREX_SPRITES.RUNNING_2.x),
          float(TREX_SPRITES.WAITING_1.x)))),

    y: float(TREX_SPRITES.WAITING_1.y), // Same Y for all running frames

    width: select(frame.lessThan(0.5), float(TREX_SPRITES.WAITING_1.width),
      select(frame.lessThan(1.5), float(TREX_SPRITES.RUNNING_1.width),
        select(frame.lessThan(2.5), float(TREX_SPRITES.RUNNING_2.width),
          float(TREX_SPRITES.WAITING_1.width)))),

    height: float(TREX_SPRITES.WAITING_1.height) // Same height for all frames
  };

  return sampleSprite(spriteTexture, p, scale, coords.x, coords.y, coords.width, coords.height);
});
