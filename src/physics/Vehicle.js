/**
 * Raycast vehicle on top of Rapier's DynamicRayCastVehicleController.
 * Pure physics: no three.js here, so it can be tuned from node.
 */
const FL = 0, FR = 1, RL = 2, RR = 3

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const approach = (value, target, rate) =>
  value < target ? Math.min(value + rate, target) : Math.max(value - rate, target)

export default class Vehicle {
  constructor(physics, tuning) {
    this.physics = physics
    this.tuning = tuning
    this.input = { throttle: 0, steer: 0, handbrake: false }
    this.steering = 0
    this.forwardSpeed = 0
    this.flippedTime = 0

    // Interpolation snapshots [x, y, z] and [x, y, z, w]
    this.previous = { position: [0, 0, 0], quaternion: [0, 0, 0, 1] }
    this.current = { position: [0, 0, 0], quaternion: [0, 0, 0, 1] }

    this.create()

    this.beforeStep = (dt) => this.update(dt)
    this.afterStep = () => this.snapshot()
    physics.beforeStep.add(this.beforeStep)
    physics.afterStep.add(this.afterStep)
  }

  create() {
    const { RAPIER, world } = this.physics
    const t = this.tuning
    const [hx, hy, hz] = t.chassisHalfExtents
    const s = (t.inertiaScale * t.mass) / 3 // box inertia: m/12 * (2h)^2 = m/3 * h^2

    this.body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setCanSleep(false)
        .setCcdEnabled(true)
        .setAngularDamping(t.angularDamping)
        .setAdditionalMassProperties(
          t.mass,
          { x: 0, y: t.centerOfMassY, z: 0 },
          { x: s * (hy * hy + hz * hz), y: s * (hx * hx + hz * hz), z: s * (hx * hx + hy * hy) },
          { w: 1, x: 0, y: 0, z: 0 }
        )
    )
    const round = 0.12
    this.collider = world.createCollider(
      RAPIER.ColliderDesc.roundCuboid(hx - round, hy - round, hz - round, round)
        .setTranslation(0, t.chassisOffsetY, 0)
        .setDensity(0)
        .setFriction(0.15)
        .setRestitution(0.2),
      this.body
    )

    this.controller = world.createVehicleController(this.body)
    this.controller.indexUpAxis = 1
    this.controller.setIndexForwardAxis = 2 // (sic) that is the setter's name in Rapier
    const down = { x: 0, y: -1, z: 0 }
    const axle = { x: -1, y: 0, z: 0 }
    for (let i = 0; i < 4; i++) {
      this.controller.addWheel(this.wheelAnchor(i), down, axle, t.suspensionRestLength, t.wheelRadius)
    }
    this.applyTuning()
    this.wheelFilter = RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC | RAPIER.QueryFilterFlags.EXCLUDE_SENSORS
  }

  /** Chassis-space hub position of wheel i (FL, FR, RL, RR). */
  wheelAnchor(i) {
    const t = this.tuning
    return { x: i % 2 ? -t.wheelX : t.wheelX, y: 0, z: i < 2 ? t.wheelFrontZ : t.wheelRearZ }
  }

  /** Push tuning values into Rapier (called again when the debug panel edits them). */
  applyTuning() {
    const t = this.tuning
    const c = this.controller
    for (let i = 0; i < 4; i++) {
      c.setWheelChassisConnectionPointCs(i, this.wheelAnchor(i))
      c.setWheelRadius(i, t.wheelRadius)
      c.setWheelSuspensionRestLength(i, t.suspensionRestLength)
      c.setWheelSuspensionStiffness(i, t.suspensionStiffness)
      c.setWheelSuspensionCompression(i, t.suspensionCompression)
      c.setWheelSuspensionRelaxation(i, t.suspensionRelaxation)
      c.setWheelMaxSuspensionTravel(i, t.maxSuspensionTravel)
      c.setWheelMaxSuspensionForce(i, t.maxSuspensionForce)
      c.setWheelFrictionSlip(i, t.frictionSlip)
      c.setWheelSideFrictionStiffness(i, t.sideFrictionStiffness)
    }
    this.body.setAngularDamping(t.angularDamping)
    this.physics.world.gravity = { x: 0, y: t.gravity, z: 0 }
  }

  update(dt) {
    const t = this.tuning
    const c = this.controller
    const body = this.body
    const { throttle, steer, handbrake } = this.input

    const velocity = body.linvel()
    const forward = this.localToWorld(0, 0, 1)
    this.forwardSpeed = velocity.x * forward.x + velocity.y * forward.y + velocity.z * forward.z
    let grounded = false
    for (let i = 0; i < 4; i++) grounded ||= c.wheelIsInContact(i)

    // Steering ramps towards the input. Lock is capped so full input gives roughly
    // the same yaw rate at any speed (bicycle model: yaw = v * tan(steer) / wheelbase)
    const wheelbase = t.wheelFrontZ - t.wheelRearZ
    const maxSteer = Math.min(t.steerMax, Math.atan((wheelbase * t.turnRate) / Math.max(Math.abs(this.forwardSpeed), 0.1)))
    const returning = steer === 0 || Math.sign(steer) !== Math.sign(this.steering)
    this.steering = approach(this.steering, steer, (returning ? t.steerReturnRate : t.steerRate) * dt)
    c.setWheelSteering(FL, this.steering * maxSteer)
    c.setWheelSteering(FR, this.steering * maxSteer)

    // Up/down either drive or brake, depending on which way the car is rolling
    let accel = 0
    let brake = 0
    const rolling = Math.abs(this.forwardSpeed) > 0.8
    if (throttle !== 0 && rolling && Math.sign(throttle) !== Math.sign(this.forwardSpeed)) {
      brake = t.brake * Math.abs(throttle)
    } else if (throttle > 0) {
      accel = throttle * t.acceleration * (1 - clamp(this.forwardSpeed / t.topSpeed, 0, 1) ** t.accelerationCurve)
    } else if (throttle < 0) {
      accel = throttle * t.acceleration * 0.7 * (1 - clamp(-this.forwardSpeed / t.reverseSpeed, 0, 1) ** t.accelerationCurve)
    }

    // Rapier: engine force is applied as force * dt at the contact, and a wheel
    // only brakes when its engine force is zero. Brake is a max impulse per step.
    const drivenCount = t.allWheelDrive ? 4 : 2
    for (let i = 0; i < 4; i++) {
      const rear = i >= 2
      const locked = handbrake && rear
      const driven = (t.allWheelDrive || rear) && !locked && brake === 0
      c.setWheelEngineForce(i, driven ? (accel * t.mass) / drivenCount : 0)
      c.setWheelBrake(i, ((brake + (locked ? t.handbrake : 0)) * t.mass * dt) / 4)
      c.setWheelSideFrictionStiffness(i, locked ? t.handbrakeSideGrip : t.sideFrictionStiffness)
    }

    c.updateVehicle(dt, this.wheelFilter)

    if (grounded) {
      // Coasting drag off throttle, so the car settles instead of rolling forever
      const planar = Math.hypot(velocity.x, velocity.z)
      if (throttle === 0 && planar > 1e-3) {
        const loss = Math.min(planar, (t.coastDecel + t.coastDrag * planar) * dt)
        const k = (loss / planar) * t.mass
        body.applyImpulse({ x: -velocity.x * k, y: 0, z: -velocity.z * k }, true)
      }
      const up = this.localToWorld(0, 1, 0)
      const d = -t.downforce * t.mass * this.forwardSpeed * this.forwardSpeed * dt
      body.applyImpulse({ x: up.x * d, y: up.y * d, z: up.z * d }, true)
    }

    // Stuck on its roof or side: put it back on its wheels where it is
    this.flippedTime = this.localToWorld(0, 1, 0).y < 0.35 ? this.flippedTime + dt : 0
    if (this.flippedTime > 1.5) {
      const p = body.translation()
      this.reset([p.x, p.y + 1.5, p.z], this.heading)
    }
  }

  /** Rotate a local-space direction into world space. */
  localToWorld(x, y, z) {
    const q = this.body.rotation()
    const cx = q.y * z - q.z * y, cy = q.z * x - q.x * z, cz = q.x * y - q.y * x
    const dx = q.y * cz - q.z * cy, dy = q.z * cx - q.x * cz, dz = q.x * cy - q.y * cx
    return { x: x + 2 * (q.w * cx + dx), y: y + 2 * (q.w * cy + dy), z: z + 2 * (q.w * cz + dz) }
  }

  /** Yaw around +Y; 0 when facing +Z. */
  get heading() {
    const f = this.localToWorld(0, 0, 1)
    return Math.atan2(f.x, f.z)
  }

  snapshot() {
    const p = this.body.translation()
    const q = this.body.rotation()
    const { previous, current } = this
    previous.position.splice(0, 3, ...current.position)
    previous.quaternion.splice(0, 4, ...current.quaternion)
    current.position.splice(0, 3, p.x, p.y, p.z)
    current.quaternion.splice(0, 4, q.x, q.y, q.z, q.w)
  }

  /** Recreate body, collider and wheels from the current tuning, keeping the car where it is. */
  rebuild() {
    const { world } = this.physics
    const p = this.body.translation()
    const heading = this.heading
    world.removeVehicleController(this.controller)
    world.removeRigidBody(this.body)
    this.create()
    this.reset([p.x, p.y + 0.5, p.z], heading)
  }

  /** Teleport upright, facing `heading` (radians around +Y). */
  reset(position, heading = 0) {
    const body = this.body
    body.setTranslation({ x: position[0], y: position[1], z: position[2] }, true)
    body.setRotation({ x: 0, y: Math.sin(heading / 2), z: 0, w: Math.cos(heading / 2) }, true)
    body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    body.setAngvel({ x: 0, y: 0, z: 0 }, true)
    this.steering = 0
    this.flippedTime = 0
    this.snapshot()
    this.snapshot()
  }
}
