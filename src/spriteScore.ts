/**
 * Score sprite utilities for TSL shader system
 * Contains digit sprites for score display
 */

import { float, Fn, int, mix, vec2 } from 'three/tsl';
import type { FnArguments } from './types.ts';
import { PIXELS_PER_UNIT, sampleSprite } from './spriteUtils.ts';

export const DIGIT_WIDTH = 10 as const;
export const DIGIT_HEIGHT = 13 as const;

// Score sprite coordinates (LDPI version from original Chrome game)
export const SCORE_SPRITES = {
  TEXT_SPRITE_X: 655, // Base X position for score digits (horizontal layout: 0123456789HI)
  TEXT_SPRITE_Y: 2,   // Base Y position for score digits
} as const;

// Precomputed dimensions in world units (100px = 1 unit)
export const DIGIT_WIDTH_UNITS = DIGIT_WIDTH / PIXELS_PER_UNIT;
export const DIGIT_HEIGHT_UNITS = DIGIT_HEIGHT / PIXELS_PER_UNIT;

export const spriteDigit = Fn(([spriteTexture, p, scale, digitValue]: FnArguments) => {
  // Convert digitValue to int and clamp to valid range (0-9)
  const clampedDigit = int(digitValue).clamp(0, 9);

  // Digits are arranged horizontally: 0123456789HI
  // Each digit is 10px wide, so X offset = digit * 10
  const digitXOffset = float(clampedDigit).mul(float(DIGIT_WIDTH));

  return sampleSprite(
    spriteTexture, p, scale,
    float(SCORE_SPRITES.TEXT_SPRITE_X).add(digitXOffset),
    float(SCORE_SPRITES.TEXT_SPRITE_Y),
    float(DIGIT_WIDTH),
    float(DIGIT_HEIGHT)
  );
});

// HI text is at positions 10 and 11 in the horizontal digit layout
const START_POSITION_HI = 10;
export const spriteHiText = Fn(([spriteTexture, p, scale]: FnArguments) => {
  return sampleSprite(
    spriteTexture, p, scale,
    float(SCORE_SPRITES.TEXT_SPRITE_X + START_POSITION_HI * DIGIT_WIDTH),
    float(SCORE_SPRITES.TEXT_SPRITE_Y),
    float(2 * DIGIT_WIDTH),
    float(DIGIT_HEIGHT)
  );
});

/**
 * Renders a complete score with up to 5 digits
 * Reference point is the rightmost digit position
 * @param spriteTexture - The sprite sheet texture
 * @param p - Position coordinates
 * @param scale - Scale factor
 * @param score - Score value to display (0-99999)
 */
export const spriteScore = Fn(([spriteTexture, p, scale, score]: FnArguments) => {
  const scoreInt = int(score).clamp(0, 99999);

  // Extract individual digits (rightmost first)
  const digit0 = scoreInt.mod(10);
  const digit1 = scoreInt.div(10).mod(10);
  const digit2 = scoreInt.div(100).mod(10);
  const digit3 = scoreInt.div(1000).mod(10);
  const digit4 = scoreInt.div(10000).mod(10);

  // Digit positions (rightmost digit at reference position)
  // Each digit is DIGIT_WIDTH_UNITS wide, positioned left of the previous one
  const digitSpacing = float(DIGIT_WIDTH_UNITS);

  const pos0 = p; // Rightmost digit at reference position
  const pos1 = p.add(vec2(digitSpacing, 0));
  const pos2 = p.add(vec2(digitSpacing.mul(2), 0));
  const pos3 = p.add(vec2(digitSpacing.mul(3), 0));
  const pos4 = p.add(vec2(digitSpacing.mul(4), 0));

  // Render each digit
  const sprite0 = spriteDigit(spriteTexture, pos0, scale, digit0);
  const sprite1 = spriteDigit(spriteTexture, pos1, scale, digit1);
  const sprite2 = spriteDigit(spriteTexture, pos2, scale, digit2);
  const sprite3 = spriteDigit(spriteTexture, pos3, scale, digit3);
  const sprite4 = spriteDigit(spriteTexture, pos4, scale, digit4);

  // Combine all sprites (right to left blending)
  let result = sprite0;
  result = mix(result, sprite1, sprite1.w);
  result = mix(result, sprite2, sprite2.w);
  result = mix(result, sprite3, sprite3.w);
  result = mix(result, sprite4, sprite4.w);

  return result;
});
