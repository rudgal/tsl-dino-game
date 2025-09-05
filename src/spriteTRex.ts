/**
 * T-Rex sprite utilities for TSL shader system
 */

import { float, floor, Fn, hash, mix, mod, select, vec2 } from 'three/tsl';
import type { FnArguments } from './types.ts';
import { sampleSprite } from './spriteUtils.ts';

// T-Rex states (matching Chrome dino game)
export const TREX_STATE = {
  WAITING: 0,
  RUNNING: 1,
  JUMPING: 2,
  DUCKING: 3,
  CRASHED: 4
} as const;

// Animation speeds (frames per second) - matching Chrome dino game
export const TREX_ANIMATION_SPEED = {
  RUNNING_FPS: 10,  // 12 FPS for running animation
  DUCKING_FPS: 8,   // 8 FPS for ducking animation
  WAITING_FPS: 3,   // 3 FPS for waiting/blinking animation
} as const;

// Pseudorandom blinking function
// Returns true when T-Rex should blink (eyes closed)
export const isBlinking = Fn(([animTime]: FnArguments) => {
  // Fixed blink duration
  const blinkDuration = float(0.1);
  // Random interval between blinks
  const minInterval = float(1.5);
  const maxInterval = float(4.0);

  // Use floor of time to create "blink cycles"
  const cycleIndex = floor(animTime.div(float(2.0))); // New cycle every ~2 seconds average
  const randomValue = hash(cycleIndex); // Hash gives us 0-1 pseudorandom value
  const blinkInterval = mix(minInterval, maxInterval, randomValue); // Random interval

  // Check if we're in a blink phase
  const cycleTime = mod(animTime, blinkInterval.add(blinkDuration));
  return cycleTime.greaterThan(blinkInterval); // Blink at the end of each interval
});

// T-Rex sprite coordinates (LDPI version from extract script)
export const TREX_SPRITES = {
  WAITING_1: {x: 848, y: 2, width: 44, height: 47},
  WAITING_2: {x: 892, y: 2, width: 44, height: 47},
  RUNNING_1: {x: 936, y: 2, width: 44, height: 47},
  RUNNING_2: {x: 980, y: 2, width: 44, height: 47},
  JUMPING: {x: 848, y: 2, width: 44, height: 47},
  DUCKING_1: {x: 1112, y: 2, width: 59, height: 47},
  DUCKING_2: {x: 1171, y: 2, width: 58, height: 47},
  CRASHED: {x: 1068, y: 2, width: 43, height: 47}
};


export const spriteTRex = Fn(([spriteTexture, p, scale, state, animTime]: FnArguments) => {
  // Calculate frame index based on state and animation time
  const float2 = float(2);
  const runningFrame = mod(floor(animTime.mul(float(TREX_ANIMATION_SPEED.RUNNING_FPS))), float2);
  const duckingFrame = mod(floor(animTime.mul(float(TREX_ANIMATION_SPEED.DUCKING_FPS))), float2);

  // Get blinking state using the extracted function
  const shouldBlink = isBlinking(animTime);

  // Apply horizontal offset when ducking
  const positionOffset = select(state.equal(float(TREX_STATE.DUCKING)),
    vec2(0.06, 0),
    vec2(0, 0));
  const adjustedP = p.sub(positionOffset);

  // Select sprite based on state
  // WAITING state (0): eyes open (WAITING_1) most of the time, brief blink (WAITING_2)
  const waitingX = select(shouldBlink,
    float(TREX_SPRITES.WAITING_2.x),  // Blink sprite
    float(TREX_SPRITES.WAITING_1.x));  // Normal sprite

  // RUNNING state (1): alternates between RUNNING_1 and RUNNING_2
  const runningX = select(runningFrame.equal(float(0)),
    float(TREX_SPRITES.RUNNING_1.x),
    float(TREX_SPRITES.RUNNING_2.x));

  // DUCKING state (3): alternates between DUCKING_1 and DUCKING_2
  const duckingX = select(duckingFrame.equal(float(0)),
    float(TREX_SPRITES.DUCKING_1.x),
    float(TREX_SPRITES.DUCKING_2.x));
  const duckingWidth = select(duckingFrame.equal(float(0)),
    float(TREX_SPRITES.DUCKING_1.width),
    float(TREX_SPRITES.DUCKING_2.width));

  // Select final sprite coordinates based on state
  const spriteX = select(state.equal(float(TREX_STATE.WAITING)), waitingX,
    select(state.equal(float(TREX_STATE.RUNNING)), runningX,
      select(state.equal(float(TREX_STATE.JUMPING)), float(TREX_SPRITES.JUMPING.x),
        select(state.equal(float(TREX_STATE.DUCKING)), duckingX,
          float(TREX_SPRITES.CRASHED.x)))));

  const spriteWidth = select(state.equal(float(TREX_STATE.DUCKING)), duckingWidth,
    select(state.equal(float(TREX_STATE.CRASHED)), float(TREX_SPRITES.CRASHED.width),
      float(TREX_SPRITES.WAITING_1.width)));

  const spriteY = float(TREX_SPRITES.WAITING_1.y);
  const spriteHeight = float(TREX_SPRITES.WAITING_1.height);

  return sampleSprite(spriteTexture, adjustedP, scale, spriteX, spriteY, spriteWidth, spriteHeight);
});
