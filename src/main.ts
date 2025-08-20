import './style.css'
import * as THREE from 'three/webgpu'
import type { ShaderNodeObject } from 'three/tsl';
import { abs, color, Fn, length, max, min, mix, negate, positionLocal, rotateUV, uniform, vec2, vec3 } from 'three/tsl';
import { GUI } from 'dat.gui'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10
)
camera.position.z = 1

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

type FnArguments = ShaderNodeObject<any>[];

const Circle = Fn(([position, radius]: FnArguments) => {
  return length(position).sub(radius)
})

const Ellipse = Fn(([position, radius, scale, angle]: FnArguments) => {
  const angledPosition = rotateUV(position, angle, vec2())
  const scaledPosition = angledPosition.mul(scale)
  return length(scaledPosition).sub(radius)
})

const Box = Fn(([position, dimensions, angle]: FnArguments) => {
  const angledPosition = rotateUV(position, angle, vec2())
  const distance = abs(angledPosition).sub(dimensions)
  return length(max(distance, 0.0)).add(min(max(distance.x, distance.y), 0.0))
})

// @ts-ignore - TSL object parameters appear not fully supported in TypeScript yet
const col = Fn(({r, g, b}: any) => {
  return vec3(r, g, b);
}) as any;

const main = Fn(() => {
  const p = positionLocal.toVar()
  const t = 0 //time.div(2)
  const radius = 0.25;

  // const green1 = col( 0, 1, 0 ); // option 1
  // const green2 = col( { r: 0, g: 1, b: 0 } ); // option 2

  const circle = Circle(p.sub(vec2(-0.6, 0)), radius).smoothstep(0.005, 0)

  const ellipse = Ellipse(p.sub(vec2(0, 0)), radius, vec2(1, 2), t).smoothstep(0.005, 0)

  const box = Box(p.sub(vec2(0.6, 0)), vec2(radius, 0.25), negate(t)).smoothstep(0.005, 0)

  const finalColour = mix(vec3(0), color('crimson'), circle)
  finalColour.assign(mix(finalColour, color('yellow'), ellipse))
  finalColour.assign(mix(finalColour, color('green'), box))

  return finalColour
})

const material = new THREE.NodeMaterial()
material.fragmentNode = main()
material.side = THREE.DoubleSide

const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.8), material)
scene.add(mesh)

// renderer.debug.getShaderAsync(scene, camera, mesh).then((e) => {
//   console.log(e.vertexShader)
//   console.log(e.fragmentShader)
// })

const gui = new GUI()
gui.add(options, 'rotationSpeed', 0.1, 3, 0.1).onChange((v) => {
  rotationSpeed.value = v
})

function animate() {
  controls.update()

  renderer.render(scene, camera)
}
