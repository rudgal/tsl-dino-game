import './style.css'
import * as THREE from 'three/webgpu'
import { Fn, mix, negate, positionLocal, texture, time, uniform, vec2, vec3 } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GUI } from 'dat.gui';
import { spriteHorizonRepeating } from './spriteMisc.ts';
import { spriteTRex, TREX_STATE } from './spriteTRex.ts';
import { initJumpSystem, updateJump } from './jumpPhysics.ts';

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

const options = {
  gameSpeed: 1,
  trexState: TREX_STATE.RUNNING as number,
  jumpOffsetY: 0,
}

/*
  ==== UNIFORMS ====
*/
const uniformGameSpeed = uniform(options.gameSpeed)
const uniformTRexState = uniform(options.trexState as number)
const uniformJumpOffsetY = uniform(options.jumpOffsetY)

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
  const t = time.mul(uniformGameSpeed)

  // Position horizon like in the original game
  const horizonSprite = spriteHorizonRepeating(spriteTextureNode, p.sub(vec2(negate(t), -0.5)), 1.0)
  // T-Rex with state-based animation
  const trexSprite = spriteTRex(spriteTextureNode, p.sub(vec2(-2.6, uniformJumpOffsetY.add(-0.33))), 1.0, uniformTRexState, time)

  const finalColour = vec3(0)
  // Add horizon sprite to the final color
  finalColour.assign(mix(finalColour, horizonSprite.xyz, horizonSprite.w))
  // Blend sprites on top (using alpha blending)
  finalColour.assign(mix(finalColour, trexSprite.xyz, trexSprite.w))

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
gui.add(options, 'gameSpeed', 0, 5, 0.1).onChange((value: number) => {
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

// Initialize jump system
initJumpSystem((newState: number) => {
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

  // Update jump physics (handles input and returns current offset)
  options.jumpOffsetY = updateJump(delta);
  uniformJumpOffsetY.value = options.jumpOffsetY;
  gui.updateDisplay()

  renderer.render(scene, camera);
}
