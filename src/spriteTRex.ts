/**
 * T-Rex sprite utilities for TSL shader system
 */

import { Fn, select, float } from 'three/tsl';
import type { FnArguments } from './types.ts';
import { sampleSprite } from './spriteUtils.ts';

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