/**
 * Score sprite utilities for TSL shader system
 * Contains digit sprites for score display
 */

import { abs, float, floor, Fn, int, log, Loop, mix, pow, select, vec2, vec4 } from 'three/tsl';
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

export const spriteScore = Fn(([spriteTexture, p, scale, score, hiScore]: FnArguments) => {
  const scoreInt = int(score || 0);
  const numDigitsScore = getDigitCountPerformant(scoreInt).clamp(5, 10);
  const hiScoreInt = int(hiScore || 0);
  const numDigitsHiScore = getDigitCountPerformant(hiScoreInt).clamp(5, 10);

  // Digit positions (rightmost digit at reference position)
  // Each digit is DIGIT_WIDTH_UNITS wide, positioned left of the previous one
  const digitSpacing = float(DIGIT_WIDTH_UNITS);


  // Render current score
  const result = vec4(0);
  Loop({start: int(0), end: int(numDigitsScore), type: 'int', condition: '<', name: 'i'}, ({i}) => {
    const digit = getDigitAtPositionPerformant(scoreInt, i);
    const digitPosition = p.add(vec2(digitSpacing.mul(i), 0));
    const sprite = spriteDigit(spriteTexture, digitPosition, scale, digit);
    result.assign(mix(result, sprite, sprite.w));
  });

  // Render high score digits (with 80% opacity like the original)
  const hiScoreOpacity = float(0.9);
  const offsetHiScore = digitSpacing.mul(numDigitsScore.add(2));
  Loop({start: int(0), end: int(numDigitsHiScore), type: 'int', condition: '<', name: 'j'}, ({j}) => {
    const digit = getDigitAtPositionPerformant(hiScoreInt, j);
    const digitPosition = p.add(vec2(offsetHiScore.add(digitSpacing.mul(j)), 0));
    const sprite = spriteDigit(spriteTexture, digitPosition, scale, digit);
    // Apply reduced opacity to high score digits
    const dimmedSprite = vec4(sprite.xyz, sprite.w.mul(hiScoreOpacity));
    result.assign(mix(result, dimmedSprite, dimmedSprite.w));
  });

  // Render HI text (with 80% opacity like the original)
  const offsetHiText = offsetHiScore.add(digitSpacing.mul(numDigitsHiScore.add(2)));
  const hiTextSprite = spriteHiText(spriteTexture, p.add(vec2(offsetHiText, 0)), scale);
  // Apply reduced opacity to HI text
  const dimmedHiText = vec4(hiTextSprite.xyz, hiTextSprite.w.mul(hiScoreOpacity));
  result.assign(mix(result, dimmedHiText, dimmedHiText.w));

  return result;
});

const getDigitAtPosition = Fn(([value, digitIndex]: FnArguments) => {
  const absValue = value.abs();
  const divisor = pow(float(10), digitIndex.toFloat());
  return int(absValue.div(divisor)).mod(10);
});

const getDigitAtPositionPerformant = Fn(([value, digitIndex]: FnArguments) => {
  const absValue = abs(value);
  // Cascade the divisor selection first, then apply mod(10) once
  const divisor = select(digitIndex.equals(0), 1,
      select(digitIndex.equals(1), 10,
        select(digitIndex.equals(2), 100,
          select(digitIndex.equals(3), 1000,
            select(digitIndex.equals(4), 10000,
              select(digitIndex.equals(5), 100000,
                select(digitIndex.equals(6), 1000000,
                  select(digitIndex.equals(7), 10000000,
                    select(digitIndex.equals(8), 100000000, 1000000000)))))))));

  // Single division and mod operation
  return int(absValue.div(divisor)).mod(10);
});

// Pre-calculated constant
const LOG10 = 2.302585093 as const; // Math.log(10)
// More efficient log10
const log10 = (x) => log(x).div(LOG10); // no log10 in tsl yet
const getDigitCount = Fn(([value]: FnArguments) => {
  const absValue = abs(value);
  const numDigits = int(floor(log10(float(absValue))));
  return select(absValue.equals(0), 1, numDigits.add(1));
});

const getDigitCountPerformant = Fn(([value]: FnArguments) => {
  const absValue = abs(value);
  return select(absValue.lessThan(10), 1,
    select(absValue.lessThan(100), 2,
      select(absValue.lessThan(1000), 3,
        select(absValue.lessThan(10000), 4,
          select(absValue.lessThan(100000), 5,
            select(absValue.lessThan(1000000), 6,
              select(absValue.lessThan(10000000), 7,
                select(absValue.lessThan(100000000), 8,
                  select(absValue.lessThan(1000000000), 9, 10)))))))));
});


