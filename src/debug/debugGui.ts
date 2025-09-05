/**
 * Debug GUI setup for the T-Rex runner game
 * Creates dat.GUI controls for debugging and testing game parameters
 */

import { GUI } from 'dat.gui';
import * as THREE from 'three/webgpu';
import { TREX_STATE } from '../tsl/tslTRex.ts';
import { clearHighScore } from '../highScore.ts';
import type { uniform } from 'three/tsl';

interface GameOptions {
  gameSpeed: number;
  gameSpeedAcceleration: number;
  trexState: number;
  jumpOffsetY: number;
  score: number;
  hiScore: number;
  scoreCoefficient: number;
  distanceRan: number;
  collisionColor: string;
  // Reference overlay options
  referenceImage: string;
  referenceOpacity: number;
  referenceColorShift: boolean;
  referenceScale: number;
}

interface GameUniforms {
  uniformDistanceRan: ReturnType<typeof uniform>;
  uniformTRexState: ReturnType<typeof uniform>;
  uniformJumpOffsetY: ReturnType<typeof uniform>;
  uniformScore: ReturnType<typeof uniform>;
  uniformHiScore: ReturnType<typeof uniform>;
  uniformCollisionColor: ReturnType<typeof uniform>;
}

export function initDebugGui(
  options: GameOptions,
  uniforms: GameUniforms,
  distanceRanRef: { value: number },
  updateReferenceImage: () => void
): GUI | null {
  const urlParams = new URLSearchParams(window.location.search);
  const DEBUG_MODE = urlParams.has('debug');

  if (!DEBUG_MODE) {
    return null;
  }

  const gui = new GUI();

  gui.add(options, 'distanceRan', 0, 10000, 0.1).onChange((value: number) => {
    uniforms.uniformDistanceRan.value = value;
  });

  gui.add(options, 'gameSpeed', 0.5, 10, 0.1).onChange(() => {
    // Game speed is stored in options but not needed in shader
  });

  gui.add(options, 'gameSpeedAcceleration', 0, 0.1, 0.001);

  // Add T-Rex state control
  const stateNames = {
    'Waiting': TREX_STATE.WAITING,
    'Running': TREX_STATE.RUNNING,
    'Jumping': TREX_STATE.JUMPING,
    'Ducking': TREX_STATE.DUCKING,
    'Crashed': TREX_STATE.CRASHED
  };
  gui.add(options, 'trexState', stateNames).name('T-Rex State').onChange((value: number) => {
    uniforms.uniformTRexState.value = value;
  });

  gui.add(options, 'jumpOffsetY', -0.5, 1.5, 0.01).onChange((value: number) => {
    uniforms.uniformJumpOffsetY.value = value;
  });

  gui.add(options, 'score', 0, 99999, 1).onChange((value: number) => {
    uniforms.uniformScore.value = value;
  });

  gui.add(options, 'scoreCoefficient', 0.05, 10, 0.05);

  // Add button to clear high score
  const clearHiScore = {
    clear: () => {
      clearHighScore();
      options.hiScore = 0;
      uniforms.uniformHiScore.value = 0;
      console.log('High score cleared!');
    }
  };
  gui.add(clearHiScore, 'clear').name('Clear High Score');

  // Add button to trigger next night mode
  const triggerNextNight = {
    trigger: () => {
      // Calculate the next night trigger point
      const currentScore = options.score;
      const nextNightScore = Math.ceil(currentScore / 700) * 700;

      // Convert score back to distanceRan using the coefficient
      // score = distanceRan * scoreCoefficient, so distanceRan = score / scoreCoefficient
      const targetDistance = nextNightScore / options.scoreCoefficient;
      distanceRanRef.value = targetDistance;

      // Update score immediately
      options.score = nextNightScore;
      uniforms.uniformScore.value = options.score;
    }
  };
  gui.add(triggerNextNight, 'trigger').name('Trigger Next Night');

  gui.addColor(options, 'collisionColor').name('Collision Color').onChange(() => {
    uniforms.uniformCollisionColor.value = new THREE.Color(options.collisionColor);
  });

  // Reference image overlay controls
  const referenceFolder = gui.addFolder('Reference Overlay');
  const imageOptions = ['None', 'Reference 01', 'Reference 02', 'Reference 03', 'Game Over'];
  referenceFolder.add(options, 'referenceImage', imageOptions).name('Image').onChange(() => {
    updateReferenceImage();
  });
  referenceFolder.add(options, 'referenceOpacity', 0, 100, 1).name('Opacity %').onChange(() => {
    updateReferenceImage();
  });
  referenceFolder.add(options, 'referenceColorShift').name('Red Color Shift').onChange(() => {
    updateReferenceImage();
  });
  referenceFolder.add(options, 'referenceScale', 25, 200, 1).name('Scale %').onChange(() => {
    updateReferenceImage();
  });

  return gui;
}
