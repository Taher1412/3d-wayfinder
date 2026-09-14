/**
 * Everything that shapes how the car drives. Units are world units (~metres),
 * seconds, and an arbitrary mass scale. Exposed live in the #debug panel.
 *
 * Car local frame: +Z forward, +Y up, +X left.
 */
export default {
  // Body
  gravity: -20,
  mass: 12,
  centerOfMassY: -0.35, // below the wheel hubs: this is what keeps it on its wheels
  inertiaScale: 1.6,
  chassisHalfExtents: [0.6, 0.3, 1.15],
  chassisOffsetY: 0.2,
  angularDamping: 1.2,

  // Wheels
  wheelRadius: 0.34,
  wheelX: 0.64,
  wheelFrontZ: 0.78,
  wheelRearZ: -0.74,
  suspensionRestLength: 0.3,
  suspensionStiffness: 40,
  suspensionCompression: 4.4, // ~0.7 of critical damping (sqrt(stiffness))
  suspensionRelaxation: 3.8,
  maxSuspensionTravel: 0.25,
  maxSuspensionForce: 1e5,
  frictionSlip: 2.4,
  sideFrictionStiffness: 1,

  // Drive
  allWheelDrive: false,
  topSpeed: 18,
  reverseSpeed: 7,
  acceleration: 16, // at standstill, fades to 0 at top speed
  accelerationCurve: 2.5, // higher keeps the pull longer before top speed
  brake: 20,
  coastDecel: 3, // off throttle: constant part...
  coastDrag: 0.35, // ...plus a part proportional to speed
  handbrake: 4,
  handbrakeSideGrip: 0.2,

  // Steering
  steerMax: 0.6, // radians of wheel lock at low speed
  turnRate: 1.8, // radians/second of yaw at full lock, whatever the speed
  steerRate: 4, // input units per second towards the target
  steerReturnRate: 7,

  // Stability
  downforce: 0.02
}
