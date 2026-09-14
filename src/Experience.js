import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Time from './utils/Time.js'

/**
 * Root of the app: renderer, scene, camera, main loop, resize.
 */
export default class Experience {
  constructor({ container }) {
    this.container = container
    this.time = new Time()

    this.setRenderer()
    this.setScene()
    this.setCamera()
    this.setResize()

    this.renderer.setAnimationLoop(() => this.tick())
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.container.appendChild(this.renderer.domElement)
  }

  setScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#dfe3e6')

    const hemi = new THREE.HemisphereLight('#ffffff', '#b9b2a6', 1.6)
    const sun = new THREE.DirectionalLight('#fff6e8', 2.2)
    sun.position.set(-30, 60, 20)
    this.scene.add(hemi, sun)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#9a9a9a' })
    )
    this.scene.add(ground)
  }

  setCamera() {
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 600)
    this.camera.position.set(30, 25, 30)
    this.orbit = new OrbitControls(this.camera, this.renderer.domElement)
    this.orbit.enableDamping = true
  }

  setResize() {
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = this.container
      this.renderer.setSize(w, h)
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', resize)
    resize()
  }

  tick() {
    this.time.update()
    this.orbit.update()
    this.renderer.render(this.scene, this.camera)
  }
}
