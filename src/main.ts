import './style.css'
import * as THREE from 'three/webgpu'
import { texture, uniform } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TREX_STATE } from './tsl/tslTRex.ts';
import { controlsTRex, initTRexControls } from './tRexControls.ts';
import { getHighScore, setHighScore } from './highScore.ts';
import { createFragmentShader } from './tsl/fragmentShader.ts';
import { initDebugGui, updateReferenceImage } from './debug/debugGui.ts';
import { CollisionDetectionSystem } from './collision/collisionDetection.ts';
import { CameraAnimation } from './cameraAnimation.ts';
import { tslBackground } from './tsl/tslBackground.ts';
import { playSound, SoundType } from './soundPlayer.ts';
import { ACHIEVEMENT_DISTANCE } from './tsl/tslScore.ts';

/*
  ==== CONSTANTS ====
*/
// Base plane dimensions (world units)
const PLANE_WIDTH = 6;
const PLANE_HEIGHT = 1.5;

// T-Rex position (world coordinates)
const TREX_X_WORLD = -2.79;

// Camera settings
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 10;
const CAMERA_Z = 4;

// Game speed settings
const GAME_SPEED_START = 3.8;
const GAME_SPEED_MAX = 7.8;
const GAME_SPEED_ACCELERATION_DEFAULT = 0.01;

// Collision detection settings
const COLLISION_DETECTION_INTERVAL = 0.05; // 50ms = 20 FPS for collision detection

// Debug mode check
const urlParams = new URLSearchParams(window.location.search);
const DEBUG_MODE = urlParams.has('debug');

// Default collision color
const DEFAULT_COLLISION_COLOR = new THREE.Color(0x444444);


const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  78,
  window.innerWidth / window.innerHeight,
  CAMERA_NEAR,
  CAMERA_FAR
)
camera.position.z = CAMERA_Z

const renderer = new THREE.WebGPURenderer({alpha: true, antialias: true})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
document.body.appendChild(renderer.domElement)
renderer.setAnimationLoop(animate)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

const options = {
  gameSpeed: GAME_SPEED_START,
  gameSpeedAcceleration: GAME_SPEED_ACCELERATION_DEFAULT,
  trexState: TREX_STATE.WAITING as number, // T-Rex state (also indicates overall game state)
  jumpOffsetY: 0,
  score: 0,
  hiScore: getHighScore(),
  scoreCoefficient: 1.8,
  distanceRan: 0,
  collisionColor: '#' + DEFAULT_COLLISION_COLOR.getHexString(),
  // Background gradient colors
  bgBottomLeft: '#dc2626',
  bgBottomRight: '#7c3aed',
  bgTopLeft: '#059669',
  bgTopRight: '#1e40af',
  // Reference overlay options
  referenceImage: 'None', //'Reference 01',
  referenceOpacity: 50,
  referenceColorShift: true,
  referenceScale: 88.6,
  // Camera animation options
  cameraAnimationEnabled: false
}
// Helper functions to check game state
const isGameOver = () => options.trexState === TREX_STATE.CRASHED;
const isGameRunning = () => options.trexState !== TREX_STATE.WAITING && options.trexState !== TREX_STATE.CRASHED;


/*
  ==== UNIFORMS ====
*/
const uniformDistanceRan = uniform(options.distanceRan)
const uniformTRexState = uniform(options.trexState as number)
const uniformJumpOffsetY = uniform(options.jumpOffsetY)
const uniformScore = uniform(options.score)
const uniformHiScore = uniform(options.hiScore)
const uniformCollisionColor = uniform(new THREE.Color(options.collisionColor))

// Background gradient uniforms
const uniformBgBottomLeft = uniform(new THREE.Color(options.bgBottomLeft))
const uniformBgBottomRight = uniform(new THREE.Color(options.bgBottomRight))
const uniformBgTopLeft = uniform(new THREE.Color(options.bgTopLeft))
const uniformBgTopRight = uniform(new THREE.Color(options.bgTopRight))

// Load sprite sheet texture
const textureLoader = new THREE.TextureLoader()
const spriteTexture = textureLoader.load('/default_100_percent/100-offline-sprite.png')
// Configure texture for pixel-perfect sprites
spriteTexture.magFilter = THREE.NearestFilter
spriteTexture.minFilter = THREE.NearestFilter
spriteTexture.generateMipmaps = false
spriteTexture.colorSpace = THREE.SRGBColorSpace // sRGB to match original Chrome dino game colors
const spriteTextureNode = texture(spriteTexture)

/*
  ==== FRAGMENT SHADER ====
*/
const fragmentShader = createFragmentShader({
  spriteTextureNode,
  uniformDistanceRan,
  uniformTRexState,
  uniformJumpOffsetY,
  uniformScore,
  uniformHiScore,
  uniformCollisionColor
});

const material = new THREE.NodeMaterial()
material.fragmentNode = fragmentShader()
material.side = THREE.DoubleSide

const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT), material)
scene.add(mesh)

// Set colorful gradient background directly on scene
scene.backgroundNode = tslBackground({
  bottomLeft: uniformBgBottomLeft,
  bottomRight: uniformBgBottomRight,
  topLeft: uniformBgTopLeft,
  topRight: uniformBgTopRight
})()

// Raycaster for restart button click detection
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

/*
  ==== DEBUG GUI & CONTROLS ====
*/
const distanceRanRef = {value: 0}; // Reference for GUI to update distanceRan

// Initialize camera animation system
const cameraAnimation = new CameraAnimation(camera, controls);

// Start animation if enabled
if (options.cameraAnimationEnabled) {
  cameraAnimation.start();
}

const gui = initDebugGui(
  options,
  {
    uniformDistanceRan,
    uniformTRexState,
    uniformJumpOffsetY,
    uniformScore,
    uniformHiScore,
    uniformCollisionColor
  },
  {
    uniformBgBottomLeft,
    uniformBgBottomRight,
    uniformBgTopLeft,
    uniformBgTopRight
  },
  distanceRanRef,
  (enabled: boolean) => cameraAnimation.toggle(enabled),
  camera
);

updateReferenceImage(options)

// Initialize T-Rex controls
initTRexControls(
  (newState: number) => {
    // Handle state transitions and play appropriate sounds
    const previousState = options.trexState;
    options.trexState = newState;
    uniformTRexState.value = options.trexState;

    // sound on jump and game start
    if ((previousState === TREX_STATE.RUNNING && newState === TREX_STATE.JUMPING)
      || (previousState === TREX_STATE.WAITING && newState === TREX_STATE.RUNNING)) {
      playSound(SoundType.BUTTON_PRESS);
    }
  },
  () => options.trexState,
  gameRestart
);

// Game restart function
function gameRestart() {
  console.log('Restarting game.');

  // Play restart sound
  playSound(SoundType.BUTTON_PRESS);

  // Reset game state variables
  options.distanceRan = 0;
  options.gameSpeed = GAME_SPEED_START;
  options.score = 0;
  options.jumpOffsetY = 0;
  options.trexState = TREX_STATE.RUNNING; // Start running immediately after restart

  // Update uniforms
  uniformDistanceRan.value = options.distanceRan;
  uniformScore.value = options.score;
  uniformJumpOffsetY.value = options.jumpOffsetY;
  uniformTRexState.value = options.trexState;

  // Reset distance counter
  distanceRan = 0;
}

// Mouse click handler for restart
function onMouseClick(event: MouseEvent) {
  // Only handle clicks when game is over
  if (!isGameOver()) return;

  // Convert mouse coordinates to normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update raycaster
  raycaster.setFromCamera(mouse, camera);

  // Check for intersection with the plane
  const intersects = raycaster.intersectObject(mesh);

  if (intersects.length > 0) {
    gameRestart();
  }
}

renderer.domElement.addEventListener('click', onMouseClick);

/*
  ==== COLLISION DETECTION ====
*/
const collisionSystem = new CollisionDetectionSystem(renderer, scene, {
  planeWidth: PLANE_WIDTH,
  planeHeight: PLANE_HEIGHT,
  trexXWorld: TREX_X_WORLD,
  cameraZ: CAMERA_Z,
  cameraNear: CAMERA_NEAR,
  cameraFar: CAMERA_FAR,
  debugMode: DEBUG_MODE
});

/*
  ==== ANIMATION LOOP ====
*/
const clock = new THREE.Clock()
let distanceRan = 0; // Track total distance in world units
let lastCollisionCheckTime = 0;

function animate() {
  const delta = clock.getDelta();

  // Update orbit controls (disabled during camera animation)
  if (!cameraAnimation.isRunning) {
    controls.update();
  }

  // Only update game state if game is running (not waiting or crashed)
  if (isGameRunning()) {
    // Gradually increase game speed up to the maximum
    if (options.gameSpeed < GAME_SPEED_MAX) {
      options.gameSpeed += options.gameSpeedAcceleration * delta;
    }

    // Calculate distance traveled this frame and update score
    const distanceDelta = options.gameSpeed * delta;
    distanceRan += distanceDelta;
    distanceRanRef.value = distanceRan;

    // Update options and uniforms
    options.distanceRan = distanceRan;
    uniformDistanceRan.value = options.distanceRan;

    // Convert distance to score using coefficient
    const calculatedScore = Math.floor(distanceRan * options.scoreCoefficient);
    options.score = calculatedScore;
    uniformScore.value = options.score;

    // Play achievement sound for score milestones
    if (calculatedScore > 0 && calculatedScore % ACHIEVEMENT_DISTANCE === 0) {
      playSound(SoundType.SCORE_REACHED);
    }
  }

  // Always update T-Rex controls (for jump handling even when waiting)
  if (!isGameOver()) {
    options.jumpOffsetY = controlsTRex(delta);
    uniformJumpOffsetY.value = options.jumpOffsetY;
  }

  // Detect collisions at specified interval (only when game is running)
  if (isGameRunning() && clock.getElapsedTime() - lastCollisionCheckTime > COLLISION_DETECTION_INTERVAL) {
    collisionSystem.detectCollision({collisionColor: options.collisionColor}).then(collision => {
      if (!collision) return;

      // Play collision sound
      playSound(SoundType.HIT);

      // Update high score
      if (options.score > options.hiScore) {
        options.hiScore = options.score;
        uniformHiScore.value = options.hiScore;
        setHighScore(options.hiScore);
        console.log('NEW HIGH SCORE!', options.hiScore);
      }

      options.trexState = TREX_STATE.CRASHED;
      uniformTRexState.value = TREX_STATE.CRASHED;
      options.gameSpeed = 0;
      console.log('GAME OVER! Score:', options.score, 'High Score:', options.hiScore);
    }).catch(console.error);
    lastCollisionCheckTime = clock.getElapsedTime();
  }

  gui?.updateDisplay()

  renderer.render(scene, camera);
}

