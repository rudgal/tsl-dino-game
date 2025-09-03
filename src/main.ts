import './style.css'
import * as THREE from 'three/webgpu'
import { color, float, Fn, mix, negate, positionLocal, select, texture, time, uniform, vec2, vec3 } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GUI } from 'dat.gui';
import { spriteHorizonRepeating } from './spriteMisc.ts';
import { spriteTRex, TREX_STATE } from './spriteTRex.ts';
import { controlsTRex, initTRexControls } from './tRexControls.ts';
import { cloudField } from './spriteCloud.ts';
import { spriteScore } from './spriteScore.ts';
import { calculateNightMode } from './nightMode.ts';
import { spriteMoon } from './spriteMoon.ts';
import { spriteStars } from './spriteStars.ts';
import { spriteObstacle } from './spriteObstacle.ts';

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10
)
camera.position.z = 2.5

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

const GAME_SPEED_START = 3.6;
const GAME_SPEED_MAX = 7.8;
const options = {
  gameSpeed: GAME_SPEED_START,
  gameSpeedAcceleration: 0.01,
  trexState: TREX_STATE.RUNNING as number,
  jumpOffsetY: 0,
  score: 0,
  scoreCoefficient: 1.5,
  // nightMode removed - now calculated in shader based on score

  // Reference overlay options
  referenceImage: 'None', //'Reference 01',
  referenceOpacity: 50,
  referenceColorShift: true,
  referenceScale: 88.6
}

/*
  ==== UNIFORMS ====
*/
const uniformGameSpeed = uniform(options.gameSpeed as number)
const uniformTRexState = uniform(options.trexState as number)
const uniformJumpOffsetY = uniform(options.jumpOffsetY)
const uniformScore = uniform(options.score)

// Load sprite sheet texture
const textureLoader = new THREE.TextureLoader()
const spriteTexture = textureLoader.load('/default_100_percent/100-offline-sprite.png')
// Configure texture for pixel-perfect sprites
spriteTexture.magFilter = THREE.NearestFilter
spriteTexture.minFilter = THREE.NearestFilter
spriteTexture.generateMipmaps = false
spriteTexture.colorSpace = THREE.SRGBColorSpace // color space sRGB to match the colors from original game
const spriteTextureNode = texture(spriteTexture)

/*
  ==== FRAGMENT SHADER ====
*/
const main = Fn(() => {
  const p = positionLocal.toVar()
  const gameTime = time.mul(uniformGameSpeed)

  // Calculate night mode data early for moon/stars
  const nightData = calculateNightMode(uniformScore)
  const nightProgress = nightData.x

  const finalColour = color('#f7f7f7')

  // Render stars (background layer, behind everything)
  const starsSprite = spriteStars(spriteTextureNode, p, gameTime, nightData)
  finalColour.assign(mix(finalColour, starsSprite.xyz, starsSprite.w))

  // Render moon (behind clouds but in front of stars)
  const moonSprite = spriteMoon(spriteTextureNode, p, gameTime, nightData)
  finalColour.assign(mix(finalColour, moonSprite.xyz, moonSprite.w))

  // Cloud field with parallax scrolling
  const cloudsSprite = cloudField(spriteTextureNode, p, gameTime, 1.0)
  finalColour.assign(mix(finalColour, cloudsSprite.xyz, cloudsSprite.w))

  // Position horizon like in the original game
  const horizonSprite = spriteHorizonRepeating(spriteTextureNode, p.sub(vec2(negate(gameTime), -0.58)), 1.0)
  finalColour.assign(mix(finalColour, horizonSprite.xyz, horizonSprite.w))

  // ===== COLLISION DETECTION: BORDER COLOR APPROACH =====

  // Pass 1: Render T-Rex BEHIND obstacles (back layer)
  const trexPos = p.sub(vec2(-2.79, uniformJumpOffsetY.add(-0.41)))
  const trexSpriteBack = spriteTRex(spriteTextureNode, trexPos, 1, uniformTRexState, time)
  const backLayerColor = mix(finalColour, trexSpriteBack.xyz, trexSpriteBack.w)

  // Render obstacles on top of back layer
  const obstacleSprite = spriteObstacle(spriteTextureNode, p, gameTime, 1, uniformScore)
  const backLayerWithObstacles = mix(backLayerColor, obstacleSprite.xyz, obstacleSprite.w)

  // Pass 2: Render T-Rex IN FRONT of obstacles (front layer)
  const trexSpriteFront = spriteTRex(spriteTextureNode, trexPos, 1, uniformTRexState, time)
  const frontLayerColor = mix(backLayerWithObstacles, trexSpriteFront.xyz, trexSpriteFront.w)

  // Collision detection: Compare back and front layers
  const colorDifference = backLayerWithObstacles.sub(frontLayerColor).abs()
  const maxDifference = colorDifference.x.max(colorDifference.y).max(colorDifference.z)
  const hasCollision = maxDifference.greaterThan(float(0.01)) // Threshold for color difference

  // Apply the front layer as final color
  finalColour.assign(frontLayerColor)

  // Score display - positioned at top right, rightmost digit as reference point
  const scoreSprite = spriteScore(spriteTextureNode, p.sub(vec2(2.83, 0.59)), 0.95, uniformScore, 0)
  // Add score elements on top (UI layer)
  finalColour.assign(mix(finalColour, scoreSprite.xyz, scoreSprite.w))

  // Apply night mode color inversion
  const invertedColour = vec3(1.0).sub(finalColour)
  finalColour.assign(mix(finalColour, invertedColour, nightProgress))

  // Visual debug: red tint when collision detected
  const debugCollision = hasCollision.select(float(0.3), float(0))
  finalColour.assign(mix(finalColour, vec3(1, 0, 0), debugCollision))

  // Dual-pixel collision output (bottom corners)
  const bottomLeft = p.x.lessThan(float(-2.99)).and(p.y.greaterThan(float(0.74)))
  const bottomRight = p.x.greaterThan(float(2.99)).and(p.y.greaterThan(float(0.74)))
  const isCollisionPixel = bottomLeft.or(bottomRight)

  // Write collision state to corner pixels
  finalColour.assign(
    select(
      isCollisionPixel,
      hasCollision.select(vec3(1, 0, 0), vec3(0, 0, 0)),
      finalColour
    )
  )

  return finalColour
})

const material = new THREE.NodeMaterial()
material.fragmentNode = main()
material.side = THREE.DoubleSide

const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), material)
scene.add(mesh)

/*
  ==== GUI CONTROLS ====
*/
const gui = new GUI()
gui.add(options, 'gameSpeed', 0.5, 10, 0.1).onChange((value: number) => {
  uniformGameSpeed.value = value
})

gui.add(options, 'gameSpeedAcceleration', 0, 0.1, 0.001)

// Add T-Rex state control
const stateNames = {
  'Waiting': TREX_STATE.WAITING,
  'Running': TREX_STATE.RUNNING,
  'Jumping': TREX_STATE.JUMPING,
  'Ducking': TREX_STATE.DUCKING,
  'Crashed': TREX_STATE.CRASHED
}
gui.add(options, 'trexState', stateNames).name('T-Rex State').onChange((value: number) => {
  uniformTRexState.value = value
})

gui.add(options, 'jumpOffsetY', -0.5, 1.5, 0.01).onChange((value: number) => {
  uniformJumpOffsetY.value = value
})

gui.add(options, 'score', 0, 99999, 1).onChange((value: number) => {
  uniformScore.value = value
})

gui.add(options, 'scoreCoefficient', 0.05, 10, 0.05)

// Add button to trigger next night mode
const triggerNextNight = {
  trigger: () => {
    // Calculate the next night trigger point
    const currentScore = options.score;
    const nextNightScore = Math.ceil(currentScore / 700) * 700;

    // Convert score back to distanceRan using the coefficient
    // score = distanceRan * scoreCoefficient, so distanceRan = score / scoreCoefficient
    const targetDistance = nextNightScore / options.scoreCoefficient;
    distanceRan = targetDistance;

    // Update score immediately
    options.score = nextNightScore;
    uniformScore.value = options.score;
  }
};
gui.add(triggerNextNight, 'trigger').name('Trigger Next Night')

// Reference image overlay controls
const referenceFolder = gui.addFolder('Reference Overlay')
const imageOptions = ['None', 'Reference 01', 'Reference 02', 'Game Over']
referenceFolder.add(options, 'referenceImage', imageOptions).name('Image').onChange(() => {
  updateReferenceImage()
})
referenceFolder.add(options, 'referenceOpacity', 0, 100, 1).name('Opacity %').onChange(() => {
  updateReferenceImage()
})
referenceFolder.add(options, 'referenceColorShift').name('Red Color Shift').onChange(() => {
  updateReferenceImage()
})
referenceFolder.add(options, 'referenceScale', 25, 200, 1).name('Scale %').onChange(() => {
  updateReferenceImage()
})
updateReferenceImage()

// Initialize T-Rex controls
initTRexControls((newState: number) => {
  options.trexState = newState;
  uniformTRexState.value = options.trexState;
});

/*
  ==== COLLISION DETECTION HELPERS ====
*/
function detectCollision(): boolean {
  // TODO: Transfer detected collision state from shader to JS/TS side
  return false;
}

/*
  ==== ANIMATION LOOP ====
*/
const clock = new THREE.Clock()
let distanceRan = 0; // Track total distance in world units
let gameOver = false;

function animate() {
  const delta = clock.getDelta();

  controls.update();

  // Only update game state if not crashed
  if (!gameOver && options.trexState !== TREX_STATE.CRASHED) {
    // Gradually increase game speed up to the maximum
    if (options.gameSpeed < GAME_SPEED_MAX) {
      options.gameSpeed += options.gameSpeedAcceleration * delta;
      uniformGameSpeed.value = options.gameSpeed;
    }

    // Calculate distance traveled this frame and update score
    const distanceDelta = options.gameSpeed * delta;
    distanceRan += distanceDelta;

    // Convert distance to score using same coefficient as reference
    const calculatedScore = Math.floor(distanceRan * options.scoreCoefficient);
    options.score = calculatedScore;
    uniformScore.value = options.score;

    // Update T-Rex controls (handles input and returns current jump offset)
    options.jumpOffsetY = controlsTRex(delta);
    uniformJumpOffsetY.value = options.jumpOffsetY;

    if (detectCollision()) {
      gameOver = true;
      options.trexState = TREX_STATE.CRASHED;
      uniformTRexState.value = TREX_STATE.CRASHED;
      options.gameSpeed = 0;
      uniformGameSpeed.value = 0;
      console.log('GAME OVER! Score:', options.score);
    }
  }

  gui.updateDisplay()

  renderer.render(scene, camera);
}

/*
  ==== REFERENCE IMAGE OVERLAY ====
*/
function updateReferenceImage() {
  const referenceImage = document.getElementById('reference-image') as HTMLImageElement;
  const referenceOverlay = document.getElementById('reference-overlay') as HTMLDivElement;
  if (!referenceImage || !referenceOverlay) return;

  const imageMap: Record<string, string> = {
    'None': '',
    'Reference 01': '/reference/reference_01.png',
    'Reference 02': '/reference/reference_02.png',
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
