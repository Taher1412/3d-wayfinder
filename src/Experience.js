import * as THREE from 'three'
import Time from './utils/Time.js'
import Physics from './physics/Physics.js'
import carTuning from './physics/carTuning.js'
import Controls from './controls/Controls.js'
import Car from './world/Car.js'
import ChaseCamera from './ChaseCamera.js'

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
    this.setTestTrack()

    this.car = new Car({ scene: this.scene, physics: this.physics, tuning: carTuning })
    this.chase = new ChaseCamera({ camera: this.camera, car: this.car, domElement: this.renderer.domElement })
    this.resetCar([0, 1, 0], Math.PI)
    this.controls.addEventListener('reset', () => this.resetCar([0, 1, 0], Math.PI))

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
    this.physics.addFixed([this.physics.RAPIER.ColliderDesc.cuboid(100, 1, 100).setTranslation(0, -1, 0)])
    this.scene.add(new THREE.GridHelper(200, 50, '#7d7d7d', '#8a8a8a'))
  }

  /** Temporary: a ramp and some crates to feel the car against. */
  setTestTrack() {
    const { RAPIER, world } = this.physics
    const material = new THREE.MeshStandardMaterial({ color: '#c4574f', flatShading: true })

    const angle = 0.22
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 8), material)
    ramp.position.set(0, 0.15, -30)
    ramp.rotation.x = angle
    this.scene.add(ramp)
    this.physics.addFixed([RAPIER.ColliderDesc.cuboid(3, 0.5, 4)], ramp.position.toArray(), ramp.quaternion)

    this.crates = []
    const crateGeometry = new THREE.BoxGeometry(1, 1, 1)
    const crateMaterial = new THREE.MeshStandardMaterial({ color: '#d8c7a0', flatShading: true })
    for (let i = 0; i < 10; i++) {
      const mesh = new THREE.Mesh(crateGeometry, crateMaterial)
      const body = world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic().setTranslation(12 + (i % 4) * 1.05, 0.5 + Math.floor(i / 4) * 1.05, -10)
      )
      world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setDensity(0.4), body)
      this.scene.add(mesh)
      this.crates.push({ mesh, body })
    }
  }

  setCamera() {
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 600)
  }

  resetCar(position, heading) {
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

    for (const { mesh, body } of this.crates) {
      mesh.position.copy(body.translation())
      mesh.quaternion.copy(body.rotation())
    }

    this.chase.update(delta)

    this.renderer.render(this.scene, this.camera)
  }
}
