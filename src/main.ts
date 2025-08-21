import './style.css'
import * as THREE from 'three/webgpu'
import { color, Fn, mix, positionLocal, uniform, vec2, vec3, texture } from 'three/tsl';
import { GUI } from 'dat.gui'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { sdBox, sdCircle, sdEllipseSimple } from './sdf2d.ts';
import { spriteTRex } from './spriteTRex.ts';
import { spriteMoon } from './spriteMoon.ts';
import { spritePterodactyl } from './spritePterodactyl.ts';
import { spriteCactusSmall, spriteCactusLarge } from './spriteCactus.ts';
import { spriteCloud, spriteHorizon, spriteGameOver, spriteStar, spriteRestart } from './spriteMisc.ts';

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
  rotationSpeed: 0.5,
  trexFrame: 0,
  cactusSmallVariant: 0,
  cactusLargeVariant: 0,
  pterodactylFrame: 0,
  showCloud: true,
  showMoon: true,
  showGameOver: false,
  showStar: true,
  showRestart: false,
  showHorizon: true,
}

const rotationSpeed = uniform(options.rotationSpeed)
const trexFrame = uniform(options.trexFrame)
const cactusSmallVariant = uniform(options.cactusSmallVariant)
const cactusLargeVariant = uniform(options.cactusLargeVariant)
const pterodactylFrame = uniform(options.pterodactylFrame)
const showCloud = uniform(options.showCloud)
const showMoon = uniform(options.showMoon)
const showGameOver = uniform(options.showGameOver)
const showStar = uniform(options.showStar)
const showRestart = uniform(options.showRestart)
const showHorizon = uniform(options.showHorizon)

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
  const radius = 0.25;

  const circle = sdCircle(p.sub(vec2(-0.6, 0)), radius).smoothstep(0.005, 0)
  const ellipse = sdEllipseSimple(p.sub(vec2(0, 0)), radius, vec2(1, 2)).smoothstep(0.005, 0)
  const box = sdBox(p.sub(vec2(0.6, 0)), vec2(radius, 0.25)).smoothstep(0.005, 0)
  
  // Add sprites
  const trexSprite = spriteTRex(spriteTextureNode, p.sub(vec2(0, -0.4)), 0.01, trexFrame)
  const cactusSmallSprite = spriteCactusSmall(spriteTextureNode, p.sub(vec2(-1.2, -0.3)), 0.015, cactusSmallVariant)
  const cactusLargeSprite = spriteCactusLarge(spriteTextureNode, p.sub(vec2(1.2, -0.2)), 0.012, cactusLargeVariant)
  const pterodactylSprite = spritePterodactyl(spriteTextureNode, p.sub(vec2(0, 0.4)), 0.012, pterodactylFrame)
  
  // Additional sprites
  const cloudSprite = spriteCloud(spriteTextureNode, p.sub(vec2(-1.8, 0.3)), 0.02)
  const moonSprite = spriteMoon(spriteTextureNode, p.sub(vec2(1.8, 0.5)), 0.02)
  const gameOverSprite = spriteGameOver(spriteTextureNode, p.sub(vec2(0, 0)), 0.005)
  const starSprite = spriteStar(spriteTextureNode, p.sub(vec2(-2.2, 0.6)), 0.03)
  const restartSprite = spriteRestart(spriteTextureNode, p.sub(vec2(2.2, 0)), 0.02)
  const horizonSprite = spriteHorizon(spriteTextureNode, p.sub(vec2(0, -0.7)), 0.005)

  const finalColour = mix(vec3(0), color('crimson'), circle)
  finalColour.assign(mix(finalColour, color('yellow'), ellipse))
  finalColour.assign(mix(finalColour, color('green'), box))
  
  // Blend sprites on top (using alpha blending)
  finalColour.assign(mix(finalColour, trexSprite.xyz, trexSprite.w))
  finalColour.assign(mix(finalColour, cactusSmallSprite.xyz, cactusSmallSprite.w))
  finalColour.assign(mix(finalColour, cactusLargeSprite.xyz, cactusLargeSprite.w))
  finalColour.assign(mix(finalColour, pterodactylSprite.xyz, pterodactylSprite.w))
  
  // Conditional sprites (only show if enabled)
  finalColour.assign(mix(finalColour, cloudSprite.xyz, cloudSprite.w.mul(showCloud)))
  finalColour.assign(mix(finalColour, moonSprite.xyz, moonSprite.w.mul(showMoon)))
  finalColour.assign(mix(finalColour, gameOverSprite.xyz, gameOverSprite.w.mul(showGameOver)))
  finalColour.assign(mix(finalColour, starSprite.xyz, starSprite.w.mul(showStar)))
  finalColour.assign(mix(finalColour, restartSprite.xyz, restartSprite.w.mul(showRestart)))
  finalColour.assign(mix(finalColour, horizonSprite.xyz, horizonSprite.w.mul(showHorizon)))

  return finalColour
})

const material = new THREE.NodeMaterial()
material.fragmentNode = main()
material.side = THREE.DoubleSide

const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), material)
scene.add(mesh)

// renderer.debug.getShaderAsync(scene, camera, mesh).then((e) => {
//   console.log(e.vertexShader)
//   console.log(e.fragmentShader)
// })

const gui = new GUI()
gui.add(options, 'rotationSpeed', 0.1, 3, 0.1).onChange((v) => {
  rotationSpeed.value = v
})
gui.add(options, 'trexFrame', 0, 2, 1).onChange((v) => {
  trexFrame.value = v
})
gui.add(options, 'cactusSmallVariant', 0, 2, 1).onChange((v) => {
  cactusSmallVariant.value = v
})
gui.add(options, 'cactusLargeVariant', 0, 2, 1).onChange((v) => {
  cactusLargeVariant.value = v
})
gui.add(options, 'pterodactylFrame', 0, 1, 1).onChange((v) => {
  pterodactylFrame.value = v
})

// Additional sprites controls
const spritesFolder = gui.addFolder('Sprites')
spritesFolder.add(options, 'showCloud').onChange((v) => {
  showCloud.value = v
})
spritesFolder.add(options, 'showMoon').onChange((v) => {
  showMoon.value = v
})
spritesFolder.add(options, 'showGameOver').onChange((v) => {
  showGameOver.value = v
})
spritesFolder.add(options, 'showStar').onChange((v) => {
  showStar.value = v
})
spritesFolder.add(options, 'showRestart').onChange((v) => {
  showRestart.value = v
})
spritesFolder.add(options, 'showHorizon').onChange((v) => {
  showHorizon.value = v
})

function animate() {
  controls.update()

  renderer.render(scene, camera)
}
