import './style.css'
import * as THREE from 'three/webgpu'
import { Fn, mix, positionLocal, uniform, vec2, vec3, texture, time, negate } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GUI } from 'dat.gui';
import { spriteHorizonRepeating } from './spriteMisc.ts';
import { spriteTRex, TREX_STATE } from './spriteTRex.ts';

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
  trexState: TREX_STATE.RUNNING,
}

// Create uniforms
const gameSpeedUniform = uniform(options.gameSpeed)
const trexStateUniform = uniform(options.trexState as number)

// Load sprite sheet texture
const textureLoader = new THREE.TextureLoader()
const spriteTexture = textureLoader.load('/default_100_percent/100-offline-sprite.png')
// Configure texture for pixel-perfect sprites
spriteTexture.magFilter = THREE.NearestFilter
spriteTexture.minFilter = THREE.NearestFilter
spriteTexture.generateMipmaps = false
const spriteTextureNode = texture(spriteTexture)

const main = Fn(() => {
  const p = positionLocal.toVar()
  const t = time.mul(gameSpeedUniform)

  // Position horizon like in the original game
  const horizonSprite = spriteHorizonRepeating(spriteTextureNode, p.sub(vec2(negate(t), -0.5)), 1.0)
  // T-Rex with state-based animation
  const trexSprite = spriteTRex(spriteTextureNode, p.sub(vec2(-2.6, -0.33)), 1.0, trexStateUniform, time)

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

// Setup dat.GUI
const gui = new GUI()
gui.add(options, 'gameSpeed', 0, 5, 0.1).onChange((value: number) => {
  gameSpeedUniform.value = value
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
  trexStateUniform.value = value
})


function animate() {
  controls.update()

  renderer.render(scene, camera)
}
