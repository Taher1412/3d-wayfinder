import * as THREE from 'three'
import GUI from 'lil-gui'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

// Tuning values that change the rigid body itself rather than a wheel setting
const REBUILD = ['mass', 'centerOfMassY', 'inertiaScale', 'chassisOffsetY']

const RANGES = {
  gravity: [-40, -5, 0.5], mass: [2, 40, 0.5], centerOfMassY: [-1, 0.5, 0.01], inertiaScale: [0.3, 4, 0.05],
  chassisOffsetY: [-0.5, 1, 0.01], angularDamping: [0, 5, 0.05],
  wheelRadius: [0.15, 0.7, 0.01], wheelX: [0.3, 1.2, 0.01], wheelFrontZ: [0.2, 1.5, 0.01], wheelRearZ: [-1.5, -0.2, 0.01],
  suspensionRestLength: [0.05, 0.8, 0.01], suspensionStiffness: [5, 150, 1], suspensionCompression: [0, 15, 0.1],
  suspensionRelaxation: [0, 15, 0.1], maxSuspensionTravel: [0.05, 1, 0.01], maxSuspensionForce: [100, 1e5, 100],
  frictionSlip: [0.2, 8, 0.05], sideFrictionStiffness: [0.1, 3, 0.05],
  topSpeed: [4, 40, 0.5], reverseSpeed: [2, 15, 0.5], acceleration: [2, 40, 0.5], accelerationCurve: [0.5, 6, 0.1],
  brake: [1, 60, 0.5], coastDecel: [0, 10, 0.1], coastDrag: [0, 2, 0.01], handbrake: [0, 30, 0.5], handbrakeSideGrip: [0, 1, 0.01],
  steerMax: [0.1, 1, 0.01], turnRate: [0.5, 4, 0.05], steerRate: [0.5, 15, 0.1], steerReturnRate: [0.5, 20, 0.1],
  downforce: [0, 0.2, 0.005]
}

/**
 * The #debug panel. Loaded on demand, so none of this ships in the main bundle
 * unless someone asks for it.
 */
export default class Debug {
  constructor(experience) {
    this.experience = experience
    this.gui = new GUI({ title: '3D Wayfinder · debug' })
    Object.assign(this.gui.domElement.style, { left: '12px', right: 'auto', top: '56px' }) // the info panel owns the right side
    this.stats = { fps: 0, calls: 0, triangles: 0, pixelRatio: 0 }
    this.frames = 0
    this.elapsed = 0

    this.setStats()
    this.setCar()
    this.setCamera()
    this.setEnvironment()
    this.setPhysics()
    this.setTeleport()
  }

  setStats() {
    const folder = this.gui.addFolder('Stats')
    for (const key of Object.keys(this.stats)) folder.add(this.stats, key).listen().disable()
  }

  setCar() {
    const { vehicle } = this.experience.car
    const tuning = vehicle.tuning
    const folder = this.gui.addFolder('Car').close()
    for (const [key, range] of Object.entries(RANGES)) {
      if (!(key in tuning)) continue
      folder.add(tuning, key, ...range).onFinishChange(() => (REBUILD.includes(key) ? vehicle.rebuild() : vehicle.applyTuning()))
    }
    folder.add(tuning, 'allWheelDrive')
    folder.add({ copy: () => navigator.clipboard?.writeText(JSON.stringify(tuning, null, 2)) }, 'copy').name('Copy tuning as JSON')
  }

  setCamera() {
    const { chase, camera, renderer, car } = this.experience
    const folder = this.gui.addFolder('Camera').close()
    const ranges = { distance: [3, 30], height: [0.5, 20], speedDistance: [0, 10], lookAhead: [0, 15], lookHeight: [0, 5], yawRate: [0.2, 12], followRate: [0.5, 20], fov: [20, 90], speedFov: [0, 20] }
    for (const [key, [min, max]] of Object.entries(ranges)) folder.add(chase.params, key, min, max, 0.1)

    this.orbit = new OrbitControls(camera, renderer.domElement)
    this.orbit.enabled = false
    this.orbit.enableDamping = true
    folder.add(this.orbit, 'enabled').name('Free orbit camera').onChange((on) => {
      this.orbit.target.copy(car.group.position)
      if (!on) chase.snap()
    })
  }

  setEnvironment() {
    const { environment } = this.experience.world
    const { scene } = this.experience
    const folder = this.gui.addFolder('Light & fog').close()
    folder.add(environment.hemisphere, 'intensity', 0, 5, 0.05).name('hemisphere')
    folder.addColor(environment.hemisphere, 'color').name('sky colour')
    folder.addColor(environment.hemisphere, 'groundColor').name('ground colour')
    folder.add(environment.sun, 'intensity', 0, 5, 0.05).name('sun')
    folder.addColor(environment.sun, 'color').name('sun colour')
    folder.add(scene.fog, 'near', 0, 600, 1).name('fog near')
    folder.add(scene.fog, 'far', 50, 1500, 1).name('fog far')
  }

  setPhysics() {
    const folder = this.gui.addFolder('Physics').close()
    this.colliders = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ vertexColors: true, depthTest: false, transparent: true, opacity: 0.8 })
    )
    this.colliders.frustumCulled = false
    this.colliders.visible = false
    this.colliders.renderOrder = 10
    this.experience.scene.add(this.colliders)
    folder.add(this.colliders, 'visible').name('Show colliders')
  }

  setTeleport() {
    const { world } = this.experience
    const places = { spawn: 'spawn', ...Object.fromEntries(world.landmarks.map((l) => [l.name, l.id])) }
    const state = { place: 'spawn' }
    this.gui.add(state, 'place', places).name('Teleport to').onChange((id) => {
      const landmark = world.landmarks.find((l) => l.id === id)
      this.experience.resetCar(landmark ? landmark.respawn : world.spawn)
    })
  }

  update(delta) {
    const { renderer, physics } = this.experience
    this.frames++
    this.elapsed += delta
    if (this.elapsed > 0.5) {
      this.stats.fps = Math.round(this.frames / this.elapsed)
      this.stats.calls = renderer.info.render.calls
      this.stats.triangles = renderer.info.render.triangles
      this.stats.pixelRatio = renderer.getPixelRatio()
      this.frames = this.elapsed = 0
    }
    if (this.orbit.enabled) this.orbit.update()
    if (this.colliders.visible) {
      const { vertices, colors } = physics.world.debugRender()
      const geometry = this.colliders.geometry
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))
    }
  }
}
