/**
 * Pterodactyl sprite utilities for TSL shader system
 */

import { Fn, select, float } from 'three/tsl';
import type { FnArguments } from './types.ts';
import { sampleSprite } from './spriteUtils.ts';

// Pterodactyl sprite coordinates (LDPI version from extract script)
export const PTERODACTYL_SPRITES = {
  FRAME_1: { x: 134, y: 2, width: 46, height: 40 }, // wings up
  FRAME_2: { x: 180, y: 2, width: 46, height: 40 }  // wings down
};

export const spritePterodactyl = Fn(([spriteTexture, p, scale, frame]: FnArguments) => {
  // Select sprite coordinates based on frame
  const coords = {
    x: select(frame.lessThan(0.5), float(PTERODACTYL_SPRITES.FRAME_1.x),
        float(PTERODACTYL_SPRITES.FRAME_2.x)),
    
    y: float(PTERODACTYL_SPRITES.FRAME_1.y), // Same Y for both frames
    
    width: float(PTERODACTYL_SPRITES.FRAME_1.width), // Same width for both frames
    
    height: float(PTERODACTYL_SPRITES.FRAME_1.height) // Same height for both frames
  };
  
  return sampleSprite(spriteTexture, p, scale, coords.x, coords.y, coords.width, coords.height);
});