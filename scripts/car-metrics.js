/**
 * Drives the car through scripted scenarios headlessly and prints handling numbers.
 * Use it when changing src/physics/carTuning.js:  npm run car:metrics
 *
 * Overrides for quick experiments:  node scripts/car-metrics.js frictionSlip=3 topSpeed=20
 */
import RAPIER from '@dimforge/rapier3d-compat'
import Physics from '../src/physics/Physics.js'
import Vehicle from '../src/physics/Vehicle.js'
import baseTuning from '../src/physics/carTuning.js'

await RAPIER.init()

const overrides = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.split('=')
    return [key, value === 'true' ? true : value === 'false' ? false : Number(value)]
  })
)

const DT = 1 / 60
const deg = (r) => (r * 180) / Math.PI

function scene(extra) {
  const tuning = { ...baseTuning, ...overrides }
  const physics = new Physics(RAPIER, { gravity: tuning.gravity })
  const { world } = physics
  world.createCollider(RAPIER.ColliderDesc.cuboid(1000, 1, 1000).setTranslation(0, -1, 0))
  extra?.(world)
  const car = new Vehicle(physics, tuning)
  car.reset([0, 0.7, 0], 0)
  const tick = (n = 1) => { for (let i = 0; i < n; i++) physics.update(DT) }
  const tilt = () => deg(Math.acos(Math.min(1, car.localToWorld(0, 1, 0).y)))
  const contacts = () => [0, 1, 2, 3].filter((i) => car.controller.wheelIsInContact(i)).length
  const speed = () => { const v = car.body.linvel(); return Math.hypot(v.x, v.z) }
  tick(60)
  return { physics, car, tick, tilt, contacts, speed, tuning }
}

const results = []
const report = (name, values) => results.push([name, values])

// Drop from 1.5 units: how bouncy is the suspension?
{
  const s = scene()
  s.car.reset([0, 1.5, 0], 0)
  let landed = false, bounces = 0, lastVy = 0, settle = null, minY = Infinity
  for (let i = 0; i < 180; i++) {
    s.tick()
    const { y } = s.car.body.translation()
    const vy = s.car.body.linvel().y
    if (s.contacts() > 0) landed = true
    if (landed) {
      minY = Math.min(minY, y)
      if (Math.sign(vy) !== Math.sign(lastVy) && Math.abs(vy - lastVy) > 0.02 && Math.abs(vy) > 0.15) bounces++
      if (settle === null && Math.abs(vy) < 0.05 && i > 10) settle = i * DT
      if (Math.abs(vy) > 0.2) settle = null
    }
    lastVy = vy
  }
  report('drop', { bounces, settleS: settle?.toFixed(2), rideHeight: s.car.body.translation().y.toFixed(3), minY: minY.toFixed(3) })
}

// Launch, then brake to a stop
{
  const s = scene()
  s.car.input.throttle = 1
  let t50 = null, t90 = null, maxPitch = 0
  for (let i = 1; i <= 300; i++) {
    s.tick()
    const v = s.car.forwardSpeed
    if (t50 === null && v > s.tuning.topSpeed * 0.5) t50 = i * DT
    if (t90 === null && v > s.tuning.topSpeed * 0.9) t90 = i * DT
    maxPitch = Math.max(maxPitch, s.tilt())
  }
  const top = s.car.forwardSpeed
  const start = s.car.body.translation().z
  s.car.input.throttle = -1
  let brakeT = 0
  while (s.car.forwardSpeed > 0.5 && brakeT < 10) { s.tick(); brakeT += DT; maxPitch = Math.max(maxPitch, s.tilt()) }
  report('launch+brake', {
    t50: t50?.toFixed(2), t90: t90?.toFixed(2), speedAt5s: top.toFixed(2),
    brakeS: brakeT.toFixed(2), brakeDist: (s.car.body.translation().z - start).toFixed(1), maxPitchDeg: maxPitch.toFixed(1)
  })
}

// Coast from top speed
{
  const s = scene()
  s.car.input.throttle = 1
  s.tick(300)
  s.car.input.throttle = 0
  let t = 0
  while (s.car.forwardSpeed > 1 && t < 20) { s.tick(); t += DT }
  report('coast to <1', { seconds: t.toFixed(2) })
}

// Reverse
{
  const s = scene()
  s.car.input.throttle = -1
  s.tick(240)
  report('reverse 4s', { speed: s.car.forwardSpeed.toFixed(2) })
}

// Steady full-lock turns at a held speed
for (const target of [5, 11, 18]) {
  const s = scene()
  s.car.input.throttle = 1
  let maxTilt = 0, minContacts = 4, slip = 0
  for (let i = 0; i < 480; i++) {
    s.car.input.throttle = s.car.forwardSpeed < target ? 1 : 0.0001
    if (i > 240) {
      s.car.input.steer = 1
      maxTilt = Math.max(maxTilt, s.tilt())
      minContacts = Math.min(minContacts, s.contacts())
      const v = s.car.body.linvel()
      const f = s.car.localToWorld(0, 0, 1)
      slip = Math.max(slip, deg(Math.acos(Math.min(1, (v.x * f.x + v.z * f.z) / (Math.hypot(v.x, v.z) + 1e-6)))))
    }
    s.tick()
  }
  const w = Math.abs(s.car.body.angvel().y)
  report(`turn @${target}`, {
    speed: s.speed().toFixed(1), radius: (s.speed() / w).toFixed(1), yawDegS: deg(w).toFixed(0),
    maxTiltDeg: maxTilt.toFixed(1), minWheels: minContacts, slipDeg: slip.toFixed(1)
  })
}

// Slalom at top speed
{
  const s = scene()
  s.car.input.throttle = 1
  s.tick(300)
  let maxTilt = 0, minContacts = 4
  for (let i = 0; i < 480; i++) {
    s.car.input.steer = Math.floor(i / 36) % 2 ? 1 : -1
    s.tick()
    maxTilt = Math.max(maxTilt, s.tilt())
    minContacts = Math.min(minContacts, s.contacts())
  }
  report('slalom @top', { speed: s.speed().toFixed(1), maxTiltDeg: maxTilt.toFixed(1), minWheels: minContacts, upright: s.car.localToWorld(0, 1, 0).y > 0.9 })
}

// Handbrake turn vs plain turn at 15
for (const handbrake of [false, true]) {
  const s = scene()
  s.car.input.throttle = 1
  while (s.car.forwardSpeed < 15) s.tick()
  const h0 = s.car.heading
  s.car.input.throttle = 0
  s.car.input.steer = 1
  s.car.input.handbrake = handbrake
  s.tick(60)
  let dh = s.car.heading - h0
  dh = Math.atan2(Math.sin(dh), Math.cos(dh))
  report(handbrake ? 'handbrake turn 1s' : 'coast turn 1s', { headingDeg: deg(dh).toFixed(0), speedAfter: s.speed().toFixed(1), tilt: s.tilt().toFixed(1) })
}

// Full speed into a wall
{
  const s = scene((world) => world.createCollider(RAPIER.ColliderDesc.cuboid(20, 3, 0.5).setTranslation(0, 3, 60)))
  s.car.input.throttle = 1
  let maxAng = 0, maxY = 0, impact = 0
  for (let i = 0; i < 480; i++) {
    s.tick()
    const a = s.car.body.angvel()
    maxAng = Math.max(maxAng, Math.hypot(a.x, a.y, a.z))
    maxY = Math.max(maxY, s.car.body.translation().y)
    impact = Math.max(impact, s.car.forwardSpeed)
  }
  report('wall @top', { impactSpeed: impact.toFixed(1), maxAngVel: maxAng.toFixed(2), maxY: maxY.toFixed(2), upright: s.car.localToWorld(0, 1, 0).y > 0.9 })
}

// Ramp jump at top speed
{
  const s = scene((world) => {
    const angle = 0.22
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(3, 0.5, 4).setTranslation(0, 0.5 - 0.35, 60)
        .setRotation({ x: -Math.sin(angle / 2), y: 0, z: 0, w: Math.cos(angle / 2) })
    )
  })
  s.car.input.throttle = 1
  let maxY = 0, maxTilt = 0, airTime = 0
  for (let i = 0; i < 480; i++) {
    s.tick()
    maxY = Math.max(maxY, s.car.body.translation().y)
    maxTilt = Math.max(maxTilt, s.tilt())
    if (s.contacts() === 0) airTime += DT
  }
  report('ramp @top', { maxY: maxY.toFixed(2), airS: airTime.toFixed(2), maxTiltDeg: maxTilt.toFixed(1), upright: s.car.localToWorld(0, 1, 0).y > 0.9 })
}

for (const [name, values] of results) {
  console.log(name.padEnd(18), Object.entries(values).map(([k, v]) => `${k}=${v}`).join('  '))
}
