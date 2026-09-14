import * as THREE from 'three'
import Vehicle from '../physics/Vehicle.js'

const _v = new THREE.Vector3()
const _q = new THREE.Quaternion()
const _qPrev = new THREE.Quaternion()

/**
 * Visual side of the car: follows the physics vehicle with interpolation,
 * places wheels on their suspension and adds a little body lean for life.
 */
export default class Car {
  constructor({ scene, physics, tuning }) {
    this.physics = physics
    this.tuning = tuning
    this.vehicle = new Vehicle(physics, tuning)

    this.group = new THREE.Group()
    this.body = new THREE.Group() // leans inside the group
    this.group.add(this.body)
    scene.add(this.group)

    this.lean = { roll: 0, pitch: 0, rollVelocity: 0, pitchVelocity: 0 }
    this.lastForwardSpeed = 0
    this.lastHeading = 0

    this.setMeshes()
  }

  setMeshes() {
    const t = this.tuning
    const [hx, hy, hz] = t.chassisHalfExtents
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(hx * 2, hy * 2, hz * 2),
      new THREE.MeshStandardMaterial({ color: '#4a6fa5', flatShading: true })
    )
    chassis.position.y = t.chassisOffsetY
    this.body.add(chassis)

    const wheelGeometry = new THREE.CylinderGeometry(t.wheelRadius, t.wheelRadius, 0.22, 12).rotateZ(Math.PI / 2)
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: '#2f3136', flatShading: true })
    const capGeometry = new THREE.BoxGeometry(0.24, 0.12, 0.12)
    const capMaterial = new THREE.MeshStandardMaterial({ color: '#f4f1ea' })
    this.wheels = []
    for (let i = 0; i < 4; i++) {
      const steer = new THREE.Group() // yaw
      const spin = new THREE.Mesh(wheelGeometry, wheelMaterial) // roll
      const cap = new THREE.Mesh(capGeometry, capMaterial)
      cap.position.y = t.wheelRadius * 0.55
      spin.add(cap)
      steer.add(spin)
      this.group.add(steer)
      this.wheels.push({ steer, spin })
    }
  }

  update(delta) {
    const { vehicle, physics } = this
    const { previous, current } = vehicle
    const alpha = physics.alpha

    // Interpolate between the last two physics steps
    this.group.position.fromArray(previous.position).lerp(_v.fromArray(current.position), alpha)
    _qPrev.fromArray(previous.quaternion)
    this.group.quaternion.copy(_qPrev.slerp(_q.fromArray(current.quaternion), alpha))

    // Wheels: hub = anchor + suspension along -Y, then steer and spin
    const c = vehicle.controller
    for (let i = 0; i < 4; i++) {
      const anchor = vehicle.wheelAnchor(i)
      const wheel = this.wheels[i]
      wheel.steer.position.set(anchor.x, -(c.wheelSuspensionLength(i) ?? this.tuning.suspensionRestLength), anchor.z)
      wheel.steer.rotation.y = c.wheelSteering(i) ?? 0
      wheel.spin.rotation.x = c.wheelRotation(i) ?? 0
    }

    this.updateLean(delta)
  }

  /** Spring the body against longitudinal and lateral acceleration. */
  updateLean(delta) {
    const { vehicle, lean } = this
    if (delta <= 0) return
    const accel = (vehicle.forwardSpeed - this.lastForwardSpeed) / delta
    const turned = vehicle.heading - this.lastHeading
    const yawRate = Math.atan2(Math.sin(turned), Math.cos(turned)) / delta
    this.lastForwardSpeed = vehicle.forwardSpeed
    this.lastHeading = vehicle.heading

    const targetPitch = THREE.MathUtils.clamp(-accel * 0.006, -0.08, 0.08)
    const targetRoll = THREE.MathUtils.clamp(yawRate * vehicle.forwardSpeed * 0.0025, -0.09, 0.09)
    const k = 90, d = 12
    lean.pitchVelocity += ((targetPitch - lean.pitch) * k - lean.pitchVelocity * d) * delta
    lean.rollVelocity += ((targetRoll - lean.roll) * k - lean.rollVelocity * d) * delta
    lean.pitch += lean.pitchVelocity * delta
    lean.roll += lean.rollVelocity * delta
    this.body.rotation.set(lean.pitch, 0, lean.roll)
  }

  reset(position, heading) {
    this.vehicle.reset(position, heading)
    this.lastHeading = heading
    this.lastForwardSpeed = 0
  }
}
