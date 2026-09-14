import ModelBuilder from './ModelBuilder.js'

/**
 * The little car. Local frame matches the physics body: +Z forward, origin at
 * the wheel anchors (about 0.53 above the ground at rest, wheel centres ~0.19 below).
 */
export function buildCarBody(tuning) {
  const b = new ModelBuilder()
  const { wheelX, wheelFrontZ, wheelRearZ } = tuning

  // Body, bonnet and bumpers
  b.box(1.22, 0.46, 2.3, { at: [0, 0.03, 0], color: 'blue' })
  b.frustum(1.16, 0.8, 1, 0.66, 0.2, { at: [0, 0.36, 0.72], color: 'blue' })
  for (const z of [1.19, -1.19]) b.box(1.28, 0.09, 0.1, { at: [0, -0.15, z], color: 'stone' })

  // Cabin: glass, pillars and the white canvas roof
  b.frustum(1.12, 1.3, 0.94, 0.94, 0.5, { at: [0, 0.51, -0.32], color: 'glass' })
  b.box(1, 0.07, 1.04, { at: [0, 0.79, -0.34], color: 'white' })
  for (const side of [-1, 1]) {
    for (const [z0, z1] of [[0.33, 0.14], [-0.3, -0.33], [-0.97, -0.8]]) {
      b.strut([side * 0.57, 0.25, z0], [side * 0.48, 0.77, z1], 0.04, 0.035, { color: 'blue' })
    }
    // Rounded fenders over each wheel and the tricolour stripe
    for (const z of [wheelFrontZ, wheelRearZ]) {
      b.arc(0.38, 0.1, Math.PI, { at: [side * wheelX * 0.97, -0.19, z], rot: [0, Math.PI / 2, 0], sides: 4, segments: 8, color: 'blueDeep' })
    }
    b.box(0.02, 0.06, 1.7, { at: [side * 0.615, 0.12, -0.05], color: 'white' })
    b.box(0.02, 0.06, 1.7, { at: [side * 0.615, 0.06, -0.05], color: 'red' })
  }

  // Face: round headlights, grille, plates; tail lights at the back
  for (const x of [-0.38, 0.38]) {
    b.cylinder(0.11, 0.11, 0.06, { at: [x, 0.2, 1.16], rot: [Math.PI / 2, 0, 0], segments: 10, color: 'white' })
    b.box(0.16, 0.09, 0.03, { at: [x * 1.2, 0.15, -1.16], color: 'red' })
  }
  b.box(0.42, 0.14, 0.03, { at: [0, 0.03, 1.16], color: 'slate' })
  for (const z of [1.25, -1.25]) b.box(0.34, 0.1, 0.02, { at: [0, -0.15, z], color: 'white' })

  return b.build().geometry
}

/** One wheel, axle along X: tyre, hubcap and a bar across it so spin reads. */
export function buildWheel(tuning) {
  const b = new ModelBuilder()
  const r = tuning.wheelRadius
  b.cylinder(r, r, 0.22, { rot: [0, 0, Math.PI / 2], segments: 12, color: 'ink' })
  b.cylinder(r * 0.5, r * 0.5, 0.24, { rot: [0, 0, Math.PI / 2], segments: 8, color: 'paper' })
  b.box(0.25, r * 0.8, 0.06, { color: 'blueDeep' })
  return b.build().geometry
}
