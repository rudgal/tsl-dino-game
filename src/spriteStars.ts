/**
 * Stars sprite for night mode
 * Displays stars with pseudo-random positioning based on night count
 */

import { float, Fn, fract, mix, mod, sin, vec2, vec4 } from 'three/tsl';
import type { FnArguments } from './types.ts';
import { sampleSprite } from './spriteUtils.ts';
import { MOON_SPEED } from './spriteMoon.ts';

const STAR_SIZE = 9; // pixels (9x9)
const STAR_SPRITE_X = 645; // X position for star sprites
const STAR_SPRITE_Y = 2;   // Base Y position for first star

const STAR_SPEED = MOON_SPEED * 1.2;

// Maximum Y position for stars
const STAR_MAX_Y = 1.1; // In our coordinate system

// Simple hash function for pseudo-random values in shader
const hash = Fn(([n]: FnArguments) => {
  return fract(sin(n).mul(43758.5453));
});

export const spriteStars = Fn(([spriteTexture, p, gameTime, nightData]: FnArguments) => {
  const nightProgress = nightData.x;
  const nightCount = nightData.y;

  const result = vec4(0);

  // Create two stars with different positions
  // Star 1
  const star1Hash = hash(nightCount.mul(2));
  const star1Y = star1Hash.mul(STAR_MAX_Y).sub(0.4); // Random Y near top
  const star1XBase = float(2).sub(gameTime.mul(STAR_SPEED));
  const star1X = mod(star1XBase.add(star1Hash.mul(3)).add(4), 8).sub(4); // Wrap with offset

  const star1Pos = p.sub(vec2(star1X, star1Y));
  const star1Sprite = sampleSprite(
    spriteTexture,
    star1Pos,
    1.0, // scale
    float(STAR_SPRITE_X),
    float(STAR_SPRITE_Y),
    float(STAR_SIZE),
    float(STAR_SIZE)
  );

  // Star 2 (offset in Y for variety)
  const star2Hash = hash(nightCount.mul(3).add(7));
  const star2Y = star2Hash.mul(STAR_MAX_Y).sub(0.4); // Different random Y
  const star2XBase = float(-1).sub(gameTime.mul(STAR_SPEED));
  const star2X = mod(star2XBase.add(star2Hash.mul(4)).add(4), 8).sub(4); // Wrap with different offset

  const star2Pos = p.sub(vec2(star2X, star2Y));
  const star2Sprite = sampleSprite(
    spriteTexture,
    star2Pos,
    1.0, // scale
    float(STAR_SPRITE_X),
    float(STAR_SPRITE_Y).add(9), // Second star sprite is 9 pixels below first
    float(STAR_SIZE),
    float(STAR_SIZE)
  );

  // combine both stars with night progress opacity
  const opacity = nightProgress;

  // blend stars (they shouldn't overlap much due to positioning)
  result.assign(vec4(star1Sprite.xyz, star1Sprite.w.mul(opacity)));
  result.assign(mix(result, vec4(star2Sprite.xyz, star2Sprite.w.mul(opacity)), star2Sprite.w.mul(opacity)));

  return result;
});
