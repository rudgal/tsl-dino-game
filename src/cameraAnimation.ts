/**
 * Camera animation system using GSAP
 * Provides smooth camera movements through predefined keyframes
 */

import * as THREE from 'three/webgpu';
import { gsap } from 'gsap';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PLANE_HEIGHT, PLANE_WIDTH } from './main.ts';

export class CameraAnimation {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private originalPosition: THREE.Vector3;
  private originalRotation: THREE.Euler;
  private timeline: gsap.core.Timeline | null = null;
  private isAnimating: boolean = false;

  constructor(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    this.camera = camera;
    this.controls = controls;

    // Store original camera settings
    this.originalPosition = camera.position.clone();
    this.originalRotation = camera.rotation.clone();
  }

  /**
   * Start the camera animation sequence
   */
  start(): void {
    if (this.isAnimating) return;

    this.isAnimating = true;

    // Kill any existing timeline
    if (this.timeline) {
      this.timeline.kill();
    }

    // Disable orbit controls during animation
    this.controls.enabled = false;

    // Create looping animation
    this.timeline = gsap.timeline({ repeat: -1, repeatDelay: 1.0 });

    // Define camera keyframes - simple zoom in and out
    const keyframes = [
      // Zoom in closer
      { pos: this.originalPosition.clone().setZ(2.5), rot: new THREE.Euler(-0.08, 0, 0), duration: 15.0, remainTime: 5.0, ease: 'power1.inOut' },
      // Tilt
      { pos: new THREE.Vector3(-2.74, 0.01, 1.43), rot: new THREE.Euler(-0.038, -0.568, -0.020), duration: 5.0, remainTime: 5.0, ease: 'power1.inOut' },
      // center zoomed in
      { pos: this.originalPosition.clone().setZ(3), rot: this.originalRotation.clone(), duration: 5, remainTime: 2.0, ease: 'power1.inOut' },
      // rotate around
      { pos: this.originalPosition.clone().setZ(-3), rot: new THREE.Euler(0, -Math.PI, 0), duration: 1.0, remainTime: 5.0, ease: 'power2.inOut' },
      // zoom out
      { pos: this.originalPosition.clone().setZ(3), rot: this.originalRotation.clone(), duration: 1, remainTime: 2.0, ease: 'power2.inOut' },
      // Return to original
      { pos: this.originalPosition.clone(), rot: this.originalRotation.clone(), duration: 5, remainTime: 15.0, ease: 'power1.inOut' }
    ];

    // Add keyframes to timeline with remain time
    let currentTime = 0;
    keyframes.forEach((keyframe) => {
      // Add movement animation at current time
      this.timeline!.to(this.camera.position, {
        x: keyframe.pos.x, y: keyframe.pos.y, z: keyframe.pos.z,
        duration: keyframe.duration, ease: keyframe.ease
      }, currentTime);

      this.timeline!.to(this.camera.rotation, {
        x: keyframe.rot.x, y: keyframe.rot.y, z: keyframe.rot.z,
        duration: keyframe.duration, ease: keyframe.ease
      }, currentTime);

      // Update time for next keyframe: movement duration + remain time
      currentTime += keyframe.duration + keyframe.remainTime;
    });
  }

  /**
   * Stop the camera animation and return to original position
   */
  stop(): void {
    if (!this.isAnimating) return;

    this.isAnimating = false;

    // Kill timeline
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }

    // Return to original position
    gsap.to(this.camera.position, {
      x: this.originalPosition.x, y: this.originalPosition.y, z: this.originalPosition.z,
      duration: 2.0, ease: 'power2.out'
    });

    gsap.to(this.camera.rotation, {
      x: this.originalRotation.x, y: this.originalRotation.y, z: this.originalRotation.z,
      duration: 2.0, ease: 'power2.out',
      onComplete: () => { this.controls.enabled = true; }
    });
  }

  /**
   * Toggle animation on/off
   */
  toggle(enabled: boolean): void {
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  /**
   * Check if animation is currently running
   */
  get isRunning(): boolean {
    return this.isAnimating;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    this.isAnimating = false;
  }
}

// Calculate responsive camera Z position based on viewport aspect ratio
export function calculateResponsiveCameraZ(camera: THREE.PerspectiveCamera): number {
  const fovRad = (camera.fov * Math.PI) / 180;
  const distanceForHeight = (PLANE_HEIGHT / 2) / Math.tan(fovRad / 2);
  const distanceForWidth = (PLANE_WIDTH / 2) / Math.tan(fovRad / 2) / camera.aspect;
  const requiredDistance = Math.max(distanceForHeight, distanceForWidth);
  return requiredDistance * 1.2; // Add some padding
}
