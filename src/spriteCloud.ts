/**
 * Cloud sprite utilities for TSL shader system
 * Hash-based procedural cloud generation for performance
 */

import { float, floor, Fn, select, sin, vec2, vec4 } from 'three/tsl';
import type { FnArguments } from './types.ts';
import { sampleSprite } from './spriteUtils.ts';

// Cloud sprite coordinates from original Chrome game (LDPI version)
export const CLOUD_SPRITE = {
  x: 86,
  y: 2,
  width: 46,
  height: 14
} as const;

// Cloud system configuration (matching reference game behavior)
export const CLOUD_CONFIG = {
  GRID_SPACING: 2.0,        // Distance between potential cloud positions (units)
  SPAWN_PROBABILITY: 0.8,   // 80% chance for testing (was 0.5)
  SKY_TOP_BOUND: -0.65,     // Top of visible sky area
  SKY_BOTTOM_BOUND: 0.3,    // Bottom of visible sky area
  BACKGROUND_SPEED: 0.2     // Slower than ground for parallax effect
} as const;

/**
 * Fast hash function for pseudo-random values in shader
 * Returns value between 0-1
 */
export const hash = Fn(([n]: [any]) => {
  return sin(n.mul(43758.5453)).fract();
});

/**
 * Generate a second hash with different seed for variation
 */
export const hash2 = Fn(([n]: [any]) => {
  return sin(n.mul(12.9898).add(78.233)).fract();
});

// JavaScript precomputed constants (truly optimized)
const SKY_RANGE_VALUE = CLOUD_CONFIG.SKY_BOTTOM_BOUND - CLOUD_CONFIG.SKY_TOP_BOUND;
const SPAWN_THRESHOLD_VALUE = 1.0 - CLOUD_CONFIG.SPAWN_PROBABILITY;

// TSL constants using precomputed values
const SKY_TOP_BOUND = float(CLOUD_CONFIG.SKY_TOP_BOUND);
const SKY_RANGE = float(SKY_RANGE_VALUE);
const GRID_SPACING = float(CLOUD_CONFIG.GRID_SPACING);
const SPAWN_THRESHOLD = float(SPAWN_THRESHOLD_VALUE);
const BACKGROUND_SPEED = float(CLOUD_CONFIG.BACKGROUND_SPEED);

/**
 * Procedural cloud field generation using hash-based positioning
 * Creates infinite scrolling cloud layer with pseudo-random distribution
 */
export const cloudField = Fn(([spriteTexture, position, gameTime, scale]: [any, any, any, any]) => {
  // Apply parallax scrolling (clouds move slower than ground)
  const scrollOffset = gameTime.mul(BACKGROUND_SPEED);
  const worldX = position.x.add(scrollOffset);

  // Divide world into grid cells for cloud placement
  const gridIndex = floor(worldX.div(GRID_SPACING));

  // Hash-based cloud existence check
  const cloudExists = hash(gridIndex).greaterThan(SPAWN_THRESHOLD);

  // Hash-based vertical positioning within visible sky bounds
  const yOffset = SKY_TOP_BOUND.add(hash2(gridIndex).mul(SKY_RANGE));

  // Calculate position within current cloud grid cell
  const cellCenter = gridIndex.mul(GRID_SPACING).add(GRID_SPACING.div(2));
  const localX = worldX.sub(cellCenter);
  const localY = position.y.add(yOffset); // Fixed: was .sub(yOffset)

  // Sample cloud sprite at calculated position
  const cloudColor = spriteCloud(spriteTexture, vec2(localX, localY), scale);

  // Return cloud if it exists at this grid position, transparent otherwise
  return select(cloudExists, cloudColor, vec4(0, 0, 0, 0));
});

/**
 * Individual cloud sprite sampling
 */
export const spriteCloud = Fn(([spriteTexture, p, scale]: FnArguments) => {
  return sampleSprite(
    spriteTexture, p, scale,
    float(CLOUD_SPRITE.x),
    float(CLOUD_SPRITE.y),
    float(CLOUD_SPRITE.width),
    float(CLOUD_SPRITE.height)
  );
});


