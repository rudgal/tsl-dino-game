import './style.css'
import * as THREE from 'three/webgpu'
import { color, Fn, mix, positionLocal, uniform, vec2, vec3 } from 'three/tsl';
import { GUI } from 'dat.gui'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { sdBox, sdCircle, sdEllipseSimple } from './sdf2d.ts';

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

const main = Fn(() => {
  const p = positionLocal.toVar()
  // const t = 0 //time.div(2)
  const radius = 0.25;

  const circle = sdCircle(p.sub(vec2(-0.6, 0)), radius).smoothstep(0.005, 0)
  const ellipse = sdEllipseSimple(p.sub(vec2(0, 0)), radius, vec2(1, 2)).smoothstep(0.005, 0)
  const box = sdBox(p.sub(vec2(0.6, 0)), vec2(radius, 0.25)).smoothstep(0.005, 0)

  const finalColour = mix(vec3(0), color('crimson'), circle)
  finalColour.assign(mix(finalColour, color('yellow'), ellipse))
  finalColour.assign(mix(finalColour, color('green'), box))

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

function animate() {
  controls.update()

  renderer.render(scene, camera)
}
