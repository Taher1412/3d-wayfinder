/**
 * Tour Eiffel: four tapered legs you can drive between, two platforms,
 * a spire and an antenna. ~23 units tall.
 */
export default function eiffel(b) {
  const foot = 4.2 // half-distance between feet
  const knee = 2 // half-distance at the first platform
  const waist = 0.9 // at the second platform

  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    // Footing and main leg
    b.box(1.8, 0.4, 1.8, { at: [sx * foot, 0.2, sz * foot], color: 'stone' })
    b.strut([sx * foot, 0.3, sz * foot], [sx * knee, 7, sz * knee], 0.75, 0.45, { color: 'bronze' })
    // Upper legs, out of reach of the car
    b.strut([sx * knee, 7.4, sz * knee], [sx * waist, 14, sz * waist], 0.42, 0.28, { color: 'bronze', solid: false })
    // Cross-bracing between the upper legs
    b.strut([sx * knee * 0.95, 8, sz * knee * 0.95], [sx * waist, 13, -sz * waist], 0.08, 0.08, { color: 'bronze', solid: false })
  }

  // Arches under the first platform, one per side
  for (let side = 0; side < 4; side++) {
    const angle = (side * Math.PI) / 2
    const out = foot - 0.9
    b.arc(3.1, 0.22, Math.PI, {
      at: [Math.sin(angle) * out, 3.4, Math.cos(angle) * out],
      rot: [0, angle, 0],
      scale: [1, 1.05, 1],
      color: 'bronze',
      solid: false
    })
  }

  // First platform with a paler railing band
  b.box(6.6, 0.55, 6.6, { at: [0, 7.1, 0], color: 'bronze', solid: false })
  b.box(6.9, 0.25, 6.9, { at: [0, 7.5, 0], color: 'sandstoneDeep', solid: false })

  // Second platform
  b.box(2.6, 0.4, 2.6, { at: [0, 14.1, 0], color: 'bronze', solid: false })
  b.box(2.8, 0.2, 2.8, { at: [0, 14.4, 0], color: 'sandstoneDeep', solid: false })

  // Spire, top cabin and antenna
  b.cylinder(0.3, 0.85, 7, { at: [0, 18, 0], segments: 4, rot: [0, Math.PI / 4, 0], color: 'bronze', solid: false })
  b.box(0.9, 0.7, 0.9, { at: [0, 21.8, 0], color: 'sandstoneDeep', solid: false })
  b.cylinder(0.05, 0.12, 2, { at: [0, 23.1, 0], segments: 5, color: 'gold', solid: false })
}
