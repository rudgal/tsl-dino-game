/**
 * Collision detection system
 * Uses GPU readback to detect pixel-level collisions
 */

import * as THREE from 'three/webgpu';
import { texture } from 'three/tsl';

// Collision detection configuration
const READBACK_WIDTH = 256;
const READBACK_HEIGHT = 64; // Adjusted for aspect ratio
const READBACK_DISPLAY_SCALE = 1 / 3;
const READBACK_FOCUS_WIDTH_PERCENT = 0.12;
const COLLISION_COLOR_DETECTION_TOLERANCE = 0.01;

interface CollisionSystemOptions {
  planeWidth: number;
  planeHeight: number;
  trexXWorld: number;
  cameraZ: number;
  cameraNear: number;
  cameraFar: number;
  debugMode: boolean;
}

interface CollisionDetectionOptions {
  collisionColor: string;
}

export class CollisionDetectionSystem {
  private renderer: THREE.WebGPURenderer;
  private scene: THREE.Scene;
  private readbackTarget: THREE.RenderTarget;
  private readbackCamera: THREE.OrthographicCamera;
  private pixelBufferTexture: THREE.DataTexture | null = null;
  private readbackDisplayMesh: THREE.Mesh | null = null;
  private options: CollisionSystemOptions;

  constructor(
    renderer: THREE.WebGPURenderer,
    scene: THREE.Scene,
    options: CollisionSystemOptions
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.options = options;

    // Create readback target with optimized resolution
    this.readbackTarget = new THREE.RenderTarget(READBACK_WIDTH, READBACK_HEIGHT, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType
    });

    // Calculate focus area dimensions
    const focusWidth = options.planeWidth * READBACK_FOCUS_WIDTH_PERCENT;

    // Create an orthographic camera that captures focused area around T-Rex
    this.readbackCamera = new THREE.OrthographicCamera(
      options.trexXWorld - focusWidth / 2,  // left: focus around T-Rex
      options.trexXWorld + focusWidth / 2,  // right: focus around T-Rex
      options.planeHeight / 2,              // top
      -options.planeHeight / 2,             // bottom (note: Y is flipped)
      options.cameraNear,
      options.cameraFar
    );
    this.readbackCamera.position.z = options.cameraZ;

    // Initialize debug display if in debug mode
    if (options.debugMode) {
      this.initDebugDisplay();
    }
  }

  private initDebugDisplay(): void {
    // Create a texture to display readback results
    const pixelBuffer = new Uint8Array(READBACK_WIDTH * READBACK_HEIGHT * 4).fill(0);
    this.pixelBufferTexture = new THREE.DataTexture(pixelBuffer, READBACK_WIDTH, READBACK_HEIGHT);
    this.pixelBufferTexture.type = THREE.UnsignedByteType;
    this.pixelBufferTexture.format = THREE.RGBAFormat;
    this.pixelBufferTexture.flipY = true;
    this.pixelBufferTexture.needsUpdate = true;

    // Material to display the readback texture
    const readbackDisplayMaterial = new THREE.NodeMaterial();
    readbackDisplayMaterial.fragmentNode = texture(this.pixelBufferTexture);

    // Calculate dimensions for display
    const focusWidth = this.options.planeWidth * READBACK_FOCUS_WIDTH_PERCENT;

    // Create a small overlay quad to display readback results (focused area)
    this.readbackDisplayMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(
        focusWidth * READBACK_DISPLAY_SCALE,
        this.options.planeHeight * READBACK_DISPLAY_SCALE
      ),
      readbackDisplayMaterial
    );

    // Position below main plane, offset to match T-Rex X position
    this.readbackDisplayMesh.position.set(
      this.options.trexXWorld * READBACK_DISPLAY_SCALE,
      -(this.options.planeHeight * 0.8),
      0
    );

    this.scene.add(this.readbackDisplayMesh);
  }

  async detectCollision(options: CollisionDetectionOptions): Promise<boolean> {
    // Hide the readback display mesh temporarily to avoid recursion
    if (this.readbackDisplayMesh) {
      this.readbackDisplayMesh.visible = false;
    }

    // Render main scene to readback target using orthographic camera
    const originalTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.readbackTarget);
    this.renderer.render(this.scene, this.readbackCamera);
    this.renderer.setRenderTarget(originalTarget);

    // Show the readback display mesh again
    if (this.readbackDisplayMesh) {
      this.readbackDisplayMesh.visible = true;
    }

    // Read back the entire readback target
    const width = this.readbackTarget.width;
    const height = this.readbackTarget.height;
    const readbackPixelBuffer = await this.renderer.readRenderTargetPixelsAsync(
      this.readbackTarget,
      0,
      0,
      width,
      height
    );

    // Update the display texture with readback data (only in debug mode)
    if (this.pixelBufferTexture) {
      const textureData = this.pixelBufferTexture.image.data as Uint8Array;
      textureData.set(readbackPixelBuffer);
      this.pixelBufferTexture.needsUpdate = true;
    }

    // Check for collision color pixels in the readback
    const targetColor = new THREE.Color(options.collisionColor);
    const targetR = targetColor.r;
    const targetG = targetColor.g;
    const targetB = targetColor.b;

    let collisionPixelCount = 0;

    for (let i = 0; i < readbackPixelBuffer.length; i += 4) {
      const r = readbackPixelBuffer[i] / 255;
      const g = readbackPixelBuffer[i + 1] / 255;
      const b = readbackPixelBuffer[i + 2] / 255;

      // Check if this pixel matches the collision color (with small tolerance for GPU precision)
      const isCollisionColor =
        Math.abs(r - targetR) < COLLISION_COLOR_DETECTION_TOLERANCE &&
        Math.abs(g - targetG) < COLLISION_COLOR_DETECTION_TOLERANCE &&
        Math.abs(b - targetB) < COLLISION_COLOR_DETECTION_TOLERANCE;

      if (isCollisionColor) {
        collisionPixelCount++;
      }
    }

    if (collisionPixelCount > 0) {
      console.log(`COLLISION DETECTED! Found ${collisionPixelCount} collision pixels`);
      return true;
    }

    return false;
  }

  dispose(): void {
    // Clean up resources
    if (this.readbackTarget) {
      this.readbackTarget.dispose();
    }
    if (this.pixelBufferTexture) {
      this.pixelBufferTexture.dispose();
    }
    if (this.readbackDisplayMesh) {
      this.scene.remove(this.readbackDisplayMesh);
      this.readbackDisplayMesh.geometry.dispose();
      (this.readbackDisplayMesh.material as THREE.Material).dispose();
    }
  }
}
