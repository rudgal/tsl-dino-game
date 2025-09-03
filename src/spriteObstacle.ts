/**
 * Obstacle system that alternates between small cactus, large cactus, and pterodactyl
 */

import { float, floor, Fn, fract, mod, select, sin, vec2, vec4 } from 'three/tsl';
import type { FnArguments } from './types.ts';
import { spriteCactusLarge, spriteCactusSmall } from './spriteCactus.ts';
import { spritePterodactyl } from './spritePterodactyl.ts';


// Obstacle spawn configuration
export const OBSTACLE_CONFIG = {
  // Spacing and positioning
  SEGMENT_SPACING: 5.0,  // Base spacing between obstacle opportunities

  // Score gates (roughly matching original speed gates)
  PTERODACTYL_MIN_SCORE: 450,    // Original: speed 8.5
  SMALL_CACTUS_GROUP_SCORE: 100, // Original: speed 4.0
  LARGE_CACTUS_GROUP_SCORE: 300, // Original: speed 7.0

  // Heights (in world units)
  CACTUS_SMALL_HEIGHT_OFFSET: -0.47,    // Small cacti positioned lower (35px tall)
  CACTUS_LARGE_HEIGHT_OFFSET: -0.39,    // Large cacti ground level (50px tall)
  PTERODACTYL_HEIGHT_OFFSETS: [-0.1, -0.25, -0.4], // High, Mid, Low positions

  // Gaps and spacing
  CACTUS_BASE_GAP: 1.2,      // ~120px in original
  PTERODACTYL_BASE_GAP: 1.5, // ~150px in original
  GAP_COEFFICIENT_RANGE: 0.5, // 1.0x to 1.5x variation

  // Animation
  PTERODACTYL_WING_SPEED: 6.0, // Matching original 6fps
  SPEED_OFFSET_RANGE: 0.8      // ±0.8 speed variation for pterodactyls
};


export const spriteObstacle = Fn(([spriteTexture, p, gameTime, scale, currentScore]: FnArguments) => {
  // Base spacing between obstacle opportunities
  const obstacleSpacing = float(OBSTACLE_CONFIG.SEGMENT_SPACING);

  // Apply scrolling using gameTime (same as horizon)
  const scrolledP = p.sub(vec2(gameTime.negate(), 0));

  // Create repeating pattern using modulo
  const localX = scrolledP.x.add(float(1.5)); // Offset to start obstacles ahead of T-Rex
  const repeatingX = mod(localX, obstacleSpacing);

  // Determine which obstacle segment we're in
  const segmentIndex = floor(localX.div(obstacleSpacing));

  // Use extracted functions for obstacle type and obstacleVariant
  const obstacleType = pseudoRandomObstacleType(segmentIndex, currentScore);
  const obstacleVariant = pseudoRandomObstacleVariant(segmentIndex);

  // Only show obstacle in center of each segment (not across entire segment width)
  const segmentCenter = obstacleSpacing.div(2);
  const distanceFromCenter = repeatingX.sub(segmentCenter).abs();
  const obstacleWidth = float(0.5); // Obstacle appears within 0.5 units of segment center
  const inObstacleZone = distanceFromCenter.lessThan(obstacleWidth);

  // Calculate position relative to segment center
  const centeredX = repeatingX.sub(segmentCenter);
  const obstaclePos = vec2(centeredX, scrolledP.y);

  // Variable pterodactyl heights - use obstacleVariant to select from 3 positions
  const pterodactylHeightOffset = select(
    obstacleVariant.lessThan(1), float(OBSTACLE_CONFIG.PTERODACTYL_HEIGHT_OFFSETS[0]),  // High position
    select(
      obstacleVariant.lessThan(2), float(OBSTACLE_CONFIG.PTERODACTYL_HEIGHT_OFFSETS[1]), // Mid position
      float(OBSTACLE_CONFIG.PTERODACTYL_HEIGHT_OFFSETS[2]) // Low position
    )
  );

  // Determine height offset based on obstacle type
  const heightOffset = select(
    obstacleType.lessThan(0.5), // Small cactus
    float(OBSTACLE_CONFIG.CACTUS_SMALL_HEIGHT_OFFSET),
    select(
      obstacleType.lessThan(1.5), // Large cactus
      float(OBSTACLE_CONFIG.CACTUS_LARGE_HEIGHT_OFFSET),
      pterodactylHeightOffset // Pterodactyl
    )
  );

  const adjustedPos = obstaclePos.sub(vec2(0, heightOffset));

  // Animation parameters
  const animationFrame = mod(gameTime.mul(float(OBSTACLE_CONFIG.PTERODACTYL_WING_SPEED)), 2);

  // Render all obstacle types
  const smallCactusSprite = spriteCactusSmall(spriteTexture, adjustedPos, scale, obstacleVariant);
  const largeCactusSprite = spriteCactusLarge(spriteTexture, adjustedPos, scale, obstacleVariant);
  const pterodactylSprite = spritePterodactyl(spriteTexture, adjustedPos, scale, animationFrame);

  // Select which sprite to show based on current obstacle type
  const selectedSprite = select(
    obstacleType.lessThan(0.5), // Small cactus (0 <= type < 0.5)
    smallCactusSprite,
    select(
      obstacleType.lessThan(1.5), // Large cactus (0.5 <= type < 1.5)
      largeCactusSprite,
      pterodactylSprite // Pterodactyl (1.5 <= type < 2.5)
    )
  );

  return select(inObstacleZone, selectedSprite, vec4(0, 0, 0, 0));
});

const pseudoRandomObstacleType = Fn(([segmentIndex, currentScore]: FnArguments) => {
  const pseudoRandom = fract(sin(segmentIndex.mul(21.9898)).mul(43758.5453));
  const pterodactylAvailable = currentScore.greaterThan(float(OBSTACLE_CONFIG.PTERODACTYL_MIN_SCORE));

  // Pseudo-random obstacle type selection with score gating
  return select(
    pterodactylAvailable,
    // All obstacles available - 40/30/30 split
    select(
      pseudoRandom.lessThan(0.4), float(0), // Small cactus (40%)
      select(
        pseudoRandom.lessThan(0.7), float(1), // Large cactus (30%)
        float(2) // Pterodactyl (30%)
      )
    ),
    // Only cacti available - 50/50 split
    select(pseudoRandom.lessThan(0.5), float(0), float(1))
  );
});


const pseudoRandomObstacleVariant = Fn(([segmentIndex]: FnArguments) => {
  const pseudoRandom = fract(sin(segmentIndex.mul(78.233)).mul(127.1));
  return mod(pseudoRandom.mul(3), 3); // Random variant 0, 1, or 2
});
