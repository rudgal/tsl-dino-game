/**
 * Debug GUI setup and reference overlay
 * Creates dat.GUI controls for debugging and testing game parameters
 */

import { GUI } from 'dat.gui';
import * as THREE from 'three/webgpu';
import { TREX_STATE } from './tsl/tslTRex.ts';
import { clearHighScore } from './highScore.ts';
import type { uniform } from 'three/tsl';

export interface GameOptions {
  gameSpeed: number;
  gameSpeedAcceleration: number;
  trexState: number;
  jumpOffsetY: number;
  score: number;
  hiScore: number;
  scoreCoefficient: number;
  distanceRan: number;
  collisionColor: string;
  // Background gradient colors
  bgBottomLeft: string;
  bgBottomRight: string;
  bgTopLeft: string;
  bgTopRight: string;
  // Reference overlay options
  referenceImage: string;
  referenceOpacity: number;
  referenceColorShift: boolean;
  referenceScale: number;
  cameraAnimationEnabled: boolean;
}

interface GameUniforms {
  uniformDistanceRan: ReturnType<typeof uniform>;
  uniformTRexState: ReturnType<typeof uniform>;
  uniformJumpOffsetY: ReturnType<typeof uniform>;
  uniformScore: ReturnType<typeof uniform>;
  uniformHiScore: ReturnType<typeof uniform>;
  uniformCollisionColor: ReturnType<typeof uniform>;
}

interface BackgroundUniforms {
  uniformBgBottomLeft: ReturnType<typeof uniform>;
  uniformBgBottomRight: ReturnType<typeof uniform>;
  uniformBgTopLeft: ReturnType<typeof uniform>;
  uniformBgTopRight: ReturnType<typeof uniform>;
}

export function initDebugGui(
  options: GameOptions,
  uniforms: GameUniforms,
  backgroundUniforms: BackgroundUniforms,
  distanceRanRef: { value: number },
  cameraAnimationCallback?: (enabled: boolean) => void,
  camera?: THREE.PerspectiveCamera
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
    updateReferenceImage(options);
  });
  referenceFolder.add(options, 'referenceOpacity', 0, 100, 1).name('Opacity %').onChange(() => {
    updateReferenceImage(options);
  });
  referenceFolder.add(options, 'referenceColorShift').name('Red Color Shift').onChange(() => {
    updateReferenceImage(options);
  });
  referenceFolder.add(options, 'referenceScale', 25, 200, 1).name('Scale %').onChange(() => {
    updateReferenceImage(options);
  });

  if (cameraAnimationCallback) {
    gui.add(options, 'cameraAnimationEnabled').name('CamAnimation').onChange(cameraAnimationCallback);
  }

  // Camera position logging
  if (camera) {
    const cameraUtils = {
      logPosition: () => {
        const pos = camera.position;
        const rot = camera.rotation;
        console.log(`Camera Position/Rotation:`);
        console.log(`{ pos: new THREE.Vector3(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}), rot: new THREE.Euler(${rot.x.toFixed(3)}, ${rot.y.toFixed(3)}, ${rot.z.toFixed(3)}), duration: 3.0, remainTime: 2.0, ease: 'power2.inOut' },`);
      }
    };
    gui.add(cameraUtils, 'logPosition').name('📍 Log Camera Pos');
  }

  // Add background gradient controls
  const backgroundFolder = gui.addFolder('Background Gradient');

  backgroundFolder.addColor(options, 'bgBottomLeft').name('Bottom Left').onChange((value: string) => {
    backgroundUniforms.uniformBgBottomLeft.value = new THREE.Color(value);
  });

  backgroundFolder.addColor(options, 'bgBottomRight').name('Bottom Right').onChange((value: string) => {
    backgroundUniforms.uniformBgBottomRight.value = new THREE.Color(value);
  });

  backgroundFolder.addColor(options, 'bgTopLeft').name('Top Left').onChange((value: string) => {
    backgroundUniforms.uniformBgTopLeft.value = new THREE.Color(value);
  });

  backgroundFolder.addColor(options, 'bgTopRight').name('Top Right').onChange((value: string) => {
    backgroundUniforms.uniformBgTopRight.value = new THREE.Color(value);
  });

  backgroundFolder.open();

  return gui;
}

export function updateReferenceImage(options: GameOptions): void {
  const referenceImage = document.getElementById('reference-image') as HTMLImageElement;
  const referenceOverlay = document.getElementById('reference-overlay') as HTMLDivElement;
  if (!referenceImage || !referenceOverlay) return;

  const imageMap: Record<string, string> = {
    'None': '',
    'Reference 01': '/reference/reference_01.png',
    'Reference 02': '/reference/reference_02.png',
    'Reference 03': '/reference/reference_03.png',
    'Game Over': '/reference/reference_gameOver.png'
  };

  const imagePath = imageMap[options.referenceImage];
  if (imagePath) {
    referenceOverlay.style.display = 'block';
    referenceImage.src = imagePath;
    referenceImage.style.display = 'block';
    referenceImage.style.opacity = (options.referenceOpacity / 100).toString();

    // Apply scaling while preserving aspect ratio
    const scaleValue = options.referenceScale / 100;
    referenceImage.style.transform = `scale(${scaleValue})`;

    // Apply color shift instead of invert
    if (options.referenceColorShift) {
      referenceImage.classList.add('color-shift');
    } else {
      referenceImage.classList.remove('color-shift');
    }
  } else {
    referenceOverlay.style.display = 'none';
    referenceImage.style.display = 'none';
  }
}
