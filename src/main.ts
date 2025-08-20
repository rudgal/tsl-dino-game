import './style.css'
import * as THREE from 'three/webgpu'
import { Fn, positionLocal, rotateUV, time, uniform, vec2 } from 'three/tsl';
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

const main = Fn(() => {
  const p = positionLocal.toVar()

  p.assign(rotateUV(p.xy, time.mul(rotationSpeed), vec2())) // rotate

  return p
})

const material = new THREE.NodeMaterial()
material.fragmentNode = main()

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
