import './style.css'
import * as THREE from 'three/webgpu'
import { color, Fn, mix, positionLocal, uniform, vec2, vec3, texture, time, negate } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { sdBox, sdCircle, sdEllipseSimple } from './sdf2d.ts';
import { spriteHorizonRepeating } from './spriteMisc.ts';
import { spriteTRex } from './spriteTRex.ts';

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
}

const rotationSpeed = uniform(options.rotationSpeed)

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
  const t = time.div(2)
  const radius = 0.25;

  const circle = sdCircle(p.sub(vec2(-0.6, 0)), radius).smoothstep(0.005, 0)
  const ellipse = sdEllipseSimple(p.sub(vec2(0, 0)), radius, vec2(1, 2)).smoothstep(0.005, 0)
  const box = sdBox(p.sub(vec2(0.6, 0)), vec2(radius, 0.25)).smoothstep(0.005, 0)

  // Position horizon like in the original game
  const horizonSprite = spriteHorizonRepeating(spriteTextureNode, p.sub(vec2(negate(t), -0.5)), 1.0)
  const trexSprite = spriteTRex(spriteTextureNode, p.sub(vec2(0, -0.4)), 1.0, 1.0)

  const finalColour = mix(vec3(0), color('crimson'), circle)
  finalColour.assign(mix(finalColour, color('yellow'), ellipse))
  finalColour.assign(mix(finalColour, color('green'), box))

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


function animate() {
  controls.update()

  renderer.render(scene, camera)
}
