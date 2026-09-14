import * as THREE from 'three'
import Time from './utils/Time.js'
import Physics from './physics/Physics.js'
import carTuning from './physics/carTuning.js'
import Controls from './controls/Controls.js'
import Car from './world/Car.js'
import ChaseCamera from './ChaseCamera.js'
import World from './world/World.js'
import Panel from './ui/Panel.js'

/**
 * Root of the app: renderer, scene, camera, main loop, resize.
 */
export default class Experience {
  constructor({ container, RAPIER }) {
    this.container = container
    this.time = new Time()
    this.physics = new Physics(RAPIER, { gravity: carTuning.gravity })
    this.controls = new Controls()

    this.setRenderer()
    this.setScene()
    this.setCamera()
    this.setResize()

    this.world = new World({ scene: this.scene, physics: this.physics })
    this.car = new Car({ scene: this.scene, physics: this.physics, tuning: carTuning })
    this.chase = new ChaseCamera({ camera: this.camera, car: this.car, domElement: this.renderer.domElement })
    this.panel = new Panel(document.querySelector('#ui'))
    this.setLandmarkFlow()
    this.resetCar(this.world.spawn)

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
  }

  setCamera() {
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.5, 900)
  }

  /** Zones open panels; closing one keeps it shut until the car leaves; R returns to the last zone. */
  setLandmarkFlow() {
    const { world, panel, controls } = this
    this.lastLandmark = null
    this.dismissed = null

    world.addEventListener('enter', ({ detail: landmark }) => {
      landmark.setActive(true)
      this.lastLandmark = landmark
      if (this.dismissed !== landmark) panel.show(landmark, world.regions.get(landmark.data.region)?.name ?? '')
    })
    world.addEventListener('leave', ({ detail: landmark }) => {
      landmark.setActive(false)
      if (panel.landmark === landmark) panel.hide()
      if (this.dismissed === landmark) this.dismissed = null
    })
    panel.addEventListener('close', ({ detail: landmark }) => (this.dismissed = landmark))
    controls.addEventListener('close', () => panel.close())
    controls.addEventListener('reset', () => this.resetCar(this.lastLandmark?.respawn ?? world.spawn))
  }

  resetCar({ position, heading }) {
    this.car.reset(position, heading)
    this.car.update(0)
    this.chase.snap()
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
    const delta = this.time.delta

    Object.assign(this.car.vehicle.input, this.controls.update())
    this.physics.update(delta)
    this.car.update(delta)

    this.chase.update(delta)
    this.world.update(delta, this.car.group.position, this.camera)

    this.renderer.render(this.scene, this.camera)
  }
}
