import * as THREE from 'three'

const damp = (rate, dt) => 1 - Math.exp(-rate * dt)
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a))

/**
 * Third-person camera: sits behind the car's heading, lags a little on turns,
 * looks ahead of the car and pulls back as speed builds.
 */
export default class ChaseCamera {
  constructor({ camera, car, domElement }) {
    this.camera = camera
    this.car = car
    this.params = {
      distance: 8.5,
      height: 3.9,
      speedDistance: 3, // extra distance at top speed
      lookAhead: 4, // units ahead of the car at top speed
      lookHeight: 1.7,
      yawRate: 3, // how fast the camera swings behind the car
      followRate: 8,
      fov: 42,
      speedFov: 6
    }
    this.zoom = 1
    this.zoomTarget = 1
    this.yaw = 0
    this.speed01 = 0
    this.position = new THREE.Vector3()
    this.target = new THREE.Vector3()
    this._desired = new THREE.Vector3()
    this._look = new THREE.Vector3()

    domElement.addEventListener('wheel', (event) => {
      this.zoomTarget = THREE.MathUtils.clamp(this.zoomTarget + event.deltaY * 0.001, 0.6, 1.8)
    }, { passive: true })
    this.setPinch(domElement)
    this.snap()
  }

  setPinch(element) {
    let start = 0, startZoom = 1
    const spread = (e) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
    element.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) { start = spread(e); startZoom = this.zoomTarget }
    }, { passive: true })
    element.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && start > 0) {
        this.zoomTarget = THREE.MathUtils.clamp(startZoom * (start / spread(e)), 0.6, 1.8)
      }
    }, { passive: true })
  }

  /** Jump straight to the resting pose (after a reset). */
  snap() {
    this.yaw = this.car.vehicle.heading
    this.speed01 = 0
    this.computeDesired(this._desired, this._look)
    this.position.copy(this._desired)
    this.target.copy(this._look)
    this.apply()
  }

  computeDesired(position, look) {
    const p = this.params
    const car = this.car.group.position
    const distance = (p.distance + p.speedDistance * this.speed01) * this.zoom
    const height = p.height * this.zoom
    position.set(car.x - Math.sin(this.yaw) * distance, car.y + height, car.z - Math.cos(this.yaw) * distance)

    const heading = this.car.vehicle.heading
    const ahead = p.lookAhead * this.speed01 * Math.sign(this.car.vehicle.forwardSpeed || 1)
    look.set(car.x + Math.sin(heading) * ahead, car.y + p.lookHeight, car.z + Math.cos(heading) * ahead)
  }

  update(dt) {
    const p = this.params
    const { vehicle } = this.car
    const speed01 = Math.min(Math.abs(vehicle.forwardSpeed) / vehicle.tuning.topSpeed, 1)
    this.speed01 += (speed01 - this.speed01) * damp(2, dt)
    this.zoom += (this.zoomTarget - this.zoom) * damp(6, dt)

    // Only swing around when the car is actually going somewhere, so a spin
    // on the spot or a crash doesn't whip the view about
    const swing = p.yawRate * THREE.MathUtils.clamp(Math.abs(vehicle.forwardSpeed) / 4, 0.25, 1)
    this.yaw += wrap(vehicle.heading - this.yaw) * damp(swing, dt)

    this.computeDesired(this._desired, this._look)
    this.position.lerp(this._desired, damp(p.followRate, dt))
    this.target.lerp(this._look, damp(p.followRate * 1.5, dt))
    this.apply()
  }

  apply() {
    const p = this.params
    this.camera.position.copy(this.position)
    this.camera.lookAt(this.target)
    const fov = p.fov + p.speedFov * this.speed01
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = fov
      this.camera.updateProjectionMatrix()
    }
  }
}
