/**
 * Main fragment shader
 * Handles all sprite rendering, collision detection, and visual effects
 */

import { color, float, Fn, If, mix, negate, positionLocal, time, vec2, vec3 } from 'three/tsl';
import type { ShaderNodeObject } from 'three/tsl';
import { tslHorizonRepeating } from './tslHorizon.ts';
import { tslGameOver, tslRestart } from './tslGameOver.ts';
import { tslTRex, TREX_STATE } from './tslTRex.ts';
import { tslCloudField } from './tslCloud.ts';
import { tslScore } from './tslScore.ts';
import { calculateNightMode } from '../nightMode.ts';
import { tslMoon } from './tslMoon.ts';
import { tslStars } from './tslStars.ts';
import { tslObstacle } from './tslObstacle.ts';

interface FragmentShaderUniforms {
  spriteTextureNode: ShaderNodeObject<any>;
  uniformDistanceRan: ShaderNodeObject<any>;
  uniformTRexState: ShaderNodeObject<any>;
  uniformJumpOffsetY: ShaderNodeObject<any>;
  uniformScore: ShaderNodeObject<any>;
  uniformHiScore: ShaderNodeObject<any>;
  uniformCollisionColor: ShaderNodeObject<any>;
}

export const createFragmentShader = (uniforms: FragmentShaderUniforms) => {
  const {
    spriteTextureNode,
    uniformDistanceRan,
    uniformTRexState,
    uniformJumpOffsetY,
    uniformScore,
    uniformHiScore,
    uniformCollisionColor
  } = uniforms;

  return Fn(() => {
    const p = positionLocal.toVar();
    const gameTime = uniformDistanceRan;

    // Calculate night mode data early for moon/stars
    const nightData = calculateNightMode(uniformScore);
    const nightProgress = nightData.x;

    const finalColour = color('#f7f7f7');

    // Render stars (background layer, behind everything)
    const starsSprite = tslStars(spriteTextureNode, p, gameTime, nightData);
    finalColour.assign(mix(finalColour, starsSprite.xyz, starsSprite.w));

    // Render moon (behind clouds but in front of stars)
    const moonSprite = tslMoon(spriteTextureNode, p, gameTime, nightData);
    finalColour.assign(mix(finalColour, moonSprite.xyz, moonSprite.w));

    // Cloud field with parallax scrolling
    const cloudsSprite = tslCloudField(spriteTextureNode, p, gameTime, 1.0);
    finalColour.assign(mix(finalColour, cloudsSprite.xyz, cloudsSprite.w));

    // Position horizon like in the original game
    const horizonSprite = tslHorizonRepeating(spriteTextureNode, p.sub(vec2(negate(gameTime), -0.58)), 1.0);
    finalColour.assign(mix(finalColour, horizonSprite.xyz, horizonSprite.w));

    // ===== COLLISION DETECTION: BORDER COLOR APPROACH =====

    // Pass 1: Render T-Rex BEHIND obstacles (back layer)
    const trexPos = p.sub(vec2(-2.79, uniformJumpOffsetY.add(-0.41)));
    const trexSpriteBack = tslTRex(spriteTextureNode, trexPos, 1, uniformTRexState, time);
    const backLayerColor = mix(finalColour, trexSpriteBack.xyz, trexSpriteBack.w);

    // Render obstacles on top of back layer
    const obstacleSprite = tslObstacle(spriteTextureNode, p, gameTime, 1, uniformScore);
    const backLayerWithObstacles = mix(backLayerColor, obstacleSprite.xyz, obstacleSprite.w);

    // Pass 2: Render T-Rex IN FRONT of obstacles (front layer)
    const trexSpriteFront = tslTRex(spriteTextureNode, trexPos, 1, uniformTRexState, time);
    const frontLayerColor = mix(backLayerWithObstacles, trexSpriteFront.xyz, trexSpriteFront.w);

    // Collision detection: Compare back and front layers
    const colorDifference = backLayerWithObstacles.sub(frontLayerColor).abs();
    const maxDifference = colorDifference.x.max(colorDifference.y).max(colorDifference.z);
    const hasCollision = maxDifference.greaterThan(float(0.01)); // Threshold for color difference

    // Apply the front layer as final color
    finalColour.assign(frontLayerColor);

    // Score display - positioned at top right, rightmost digit as reference point
    const scoreSprite = tslScore(spriteTextureNode, p.sub(vec2(2.83, 0.59)), 0.95, uniformScore, uniformHiScore);
    // Add score elements on top (UI layer)
    finalColour.assign(mix(finalColour, scoreSprite.xyz, scoreSprite.w));

    // Game Over display when crashed - keep it simple for now
    const isCrashed = uniformTRexState.equal(float(TREX_STATE.CRASHED));

    // Only overlay game over elements when crashed
    If(isCrashed, () => {
      // "GAME OVER" text sprite positioned in center
      const gameOverSprite = tslGameOver(spriteTextureNode, p.sub(vec2(0, 0.27)), 1.0);
      finalColour.assign(mix(finalColour, gameOverSprite.xyz, gameOverSprite.w));

      // Restart symbol positioned below the text
      const restartSprite = tslRestart(spriteTextureNode, p.sub(vec2(0, -0.15)), 1);
      finalColour.assign(mix(finalColour, restartSprite.xyz, restartSprite.w));
    });

    // Apply night mode color inversion
    const invertedColour = vec3(1.0).sub(finalColour);
    finalColour.assign(mix(finalColour, invertedColour, nightProgress));

    // collision color tint when detected
    finalColour.assign(hasCollision.select(uniformCollisionColor, finalColour));

    return finalColour;
  });
};
