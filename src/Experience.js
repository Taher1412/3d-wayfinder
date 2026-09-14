import * as THREE from 'three'
import Time from './utils/Time.js'
import Physics from './physics/Physics.js'
import carTuning from './physics/carTuning.js'
import Controls from './controls/Controls.js'
import TouchControls from './controls/TouchControls.js'
import Car from './world/Car.js'
import ChaseCamera from './ChaseCamera.js'
import World from './world/World.js'
import Panel from './ui/Panel.js'
import Hud from './ui/Hud.js'
import { KM_PER_UNIT } from './data/geo.js'

const coarsePointer = window.matchMedia('(pointer: coarse)')

/**
 * Root of the app: renderer, scene, camera, main loop, resize, and the glue
 * between world events and the 2D UI.
 */
export default class Experience {
  constructor({ container, RAPIER }) {
    this.container = container
    this.ui = document.querySelector('#ui')
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
    this.panel = new Panel(this.ui)
    this.hud = new Hud(this.ui, { touch: coarsePointer.matches })
    this.setTouch()
    this.setLandmarkFlow()
    this.resetCar(this.world.spawn)

    this.firstFrame = new Promise((resolve) => (this.resolveFirstFrame = resolve))
    this.renderer.setAnimationLoop(() => this.tick())
  }

  setRenderer() {
    const coarse = coarsePointer.matches
    this.renderer = new THREE.WebGLRenderer({ antialias: !coarse, powerPreference: 'high-performance' })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.NeutralToneMapping

    // Pixel ratio steps down if frames stay slow: sharp on laptops, smooth on phones
    const maxRatio = Math.min(window.devicePixelRatio, coarse ? 1.5 : 2)
    this.quality = { ratio: maxRatio, min: coarse ? 0.75 : 1, frames: 0, time: 0, slowWindows: 0 }
    this.renderer.setPixelRatio(maxRatio)
    this.container.appendChild(this.renderer.domElement)
  }

  setScene() {
    this.scene = new THREE.Scene()
  }

  setCamera() {
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.5, 900)
  }

  setResize() {
    this.resize = () => {
      const { clientWidth: w, clientHeight: h } = this.container
      this.renderer.setSize(w, h)
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', this.resize)
    this.resize()
  }

  setTouch() {
    const apply = () => {
      const coarse = coarsePointer.matches
      if (coarse && !this.touch) this.touch = new TouchControls(this.ui, this.controls)
      this.touch?.setVisible(coarse)
      if (!coarse) this.controls.touch = null
      this.hud.setTouch(coarse)
    }
    coarsePointer.addEventListener('change', apply)
    apply()
  }

  /** Zones open panels; closing one keeps it shut until the car leaves; R returns to the last zone. */
  setLandmarkFlow() {
    const { world, panel, controls, hud } = this
    this.lastLandmark = null
    this.dismissed = null
    this.visited = new Set()

    world.addEventListener('enter', ({ detail: landmark }) => {
      landmark.setActive(true)
      this.lastLandmark = landmark
      this.visited.add(landmark.id)
      if (this.dismissed !== landmark) panel.show(landmark, world.regions.get(landmark.data.region)?.name ?? '')
    })
    world.addEventListener('leave', ({ detail: landmark }) => {
      landmark.setActive(false)
      if (panel.landmark === landmark) panel.hide()
      if (this.dismissed === landmark) this.dismissed = null
    })
    panel.addEventListener('close', ({ detail: landmark }) => (this.dismissed = landmark))
    controls.addEventListener('close', () => panel.close())

    const reset = () => this.resetCar(this.lastLandmark?.respawn ?? world.spawn)
    controls.addEventListener('reset', reset)
    hud.addEventListener('reset', reset)
  }

  resetCar({ position, heading }) {
    this.car.reset(position, heading)
    this.car.update(0)
    this.chase.snap()
  }

  /** Direction and distance to the closest landmark not yet visited, for the HUD compass. */
  compassTarget() {
    if (this.world.current) return null
    const { x, z } = this.car.group.position
    let best = null
    let bestDistance = Infinity
    for (const landmark of this.world.landmarks) {
      if (this.visited.has(landmark.id)) continue
      const d = Math.sqrt(landmark.distanceSquared(x, z))
      if (d < bestDistance) {
        best = landmark
        bestDistance = d
      }
    }
    if (!best) return null
    const bearing = Math.atan2(best.position.x - x, best.position.z - z) - this.chase.yaw
    return { name: best.name, distance: bestDistance * KM_PER_UNIT, angle: -Math.atan2(Math.sin(bearing), Math.cos(bearing)) }
  }

  updateQuality() {
    const q = this.quality
    if (document.hidden || this.time.elapsed < 4) return
    q.frames++
    q.time += this.time.raw
    if (q.time < 2) return
    const fps = q.frames / q.time
    q.frames = q.time = 0
    q.slowWindows = fps < 45 ? q.slowWindows + 1 : 0
    if (q.slowWindows >= 2 && q.ratio > q.min) {
      q.ratio = Math.max(q.min, q.ratio - 0.25)
      q.slowWindows = 0
      this.renderer.setPixelRatio(q.ratio)
      this.resize()
    }
  }

  tick() {
    this.time.update()
    const delta = this.time.delta
    const input = this.controls.update()

    Object.assign(this.car.vehicle.input, input)
    this.physics.update(delta)
    this.car.update(delta)
    this.chase.update(delta)
    this.world.update(delta, this.car.group.position, this.camera)
    this.hud.update(delta, { driving: input.throttle !== 0 || input.steer !== 0, pointer: this.compassTarget() })

    this.renderer.render(this.scene, this.camera)
    this.updateQuality()

    if (this.resolveFirstFrame) {
      this.resolveFirstFrame()
      this.resolveFirstFrame = null
    }
  }
}
