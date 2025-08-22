import './style.css'
import * as THREE from 'three/webgpu'
import { Fn, mix, negate, positionLocal, texture, time, uniform, vec2, vec3 } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GUI } from 'dat.gui';
import { spriteHorizonRepeating } from './spriteMisc.ts';
import { spriteTRex, TREX_STATE } from './spriteTRex.ts';
import { initTRexControls, controlsTRex } from './tRexControls.ts';
import { cloudField } from './spriteCloud.ts';
import { spriteScore } from './spriteScore.ts';

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
  score: 112345,
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
const spriteTextureNode = texture(spriteTexture)

/*
  ==== FRAGMENT SHADER ====
*/
const main = Fn(() => {
  const p = positionLocal.toVar()
  const gameTime = time.mul(uniformGameSpeed)

  // Position horizon like in the original game
  const horizonSprite = spriteHorizonRepeating(spriteTextureNode, p.sub(vec2(negate(gameTime), -0.5)), 1.0)
  // Cloud field with parallax scrolling
  const cloudsSprite = cloudField(spriteTextureNode, p, gameTime, 1.0)
  // T-Rex with state-based animation
  const trexSprite = spriteTRex(spriteTextureNode, p.sub(vec2(-2.6, uniformJumpOffsetY.add(-0.38))), 0.78, uniformTRexState, time)
  // Score display - positioned at top right, rightmost digit as reference point
  const scoreSprite = spriteScore(spriteTextureNode, p.sub(vec2(2.88, 0.6)), 1.0, uniformScore)


  const finalColour = vec3(0)
  // Add horizon sprite to the final color
  finalColour.assign(mix(finalColour, horizonSprite.xyz, horizonSprite.w))
  // Add clouds behind the T-Rex (background layer)
  finalColour.assign(mix(finalColour, cloudsSprite.xyz, cloudsSprite.w))
  // Blend T-Rex on top (using alpha blending)
  finalColour.assign(mix(finalColour, trexSprite.xyz, trexSprite.w))
  // Add score elements on top (UI layer)
  finalColour.assign(mix(finalColour, scoreSprite.xyz, scoreSprite.w))

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

// Initialize T-Rex controls
initTRexControls((newState: number) => {
  options.trexState = newState;
  uniformTRexState.value = options.trexState;
});

/*
  ==== ANIMATION LOOP ====
*/
const clock = new THREE.Clock()

function animate() {
  const delta = clock.getDelta();

  controls.update();

  // Gradually increase game speed up to the maximum
  if (options.gameSpeed < GAME_SPEED_MAX) {
    options.gameSpeed += options.gameSpeedAcceleration * delta;
    uniformGameSpeed.value = options.gameSpeed;
  }

  // Update T-Rex controls (handles input and returns current jump offset)
  options.jumpOffsetY = controlsTRex(delta);
  uniformJumpOffsetY.value = options.jumpOffsetY;

  gui.updateDisplay()

  renderer.render(scene, camera);
}
