/**
 * Pont du Gard with a Provence lavender field in front. The aqueduct's three
 * arcades are notched outlines extruded through; only its piers collide, so
 * the car fits through the big arches. The lavender rows are low enough to
 * rumble over.
 */
export default function pontDuGard(b) {
  const bridgeZ = -3.5

  // One arcade: an outline running along the bottom with an arch cut for each [centreX, halfWidth, springHeight]
  const arcade = ({ y, height, width, depth, arches, color, piers = false }) => {
    const points = [[-width / 2, 0]]
    let left = -width / 2
    for (const [cx, w, spring] of arches) {
      points.push([cx - w, 0], [cx - w, spring])
      for (let i = 1; i < 6; i++) {
        const a = Math.PI - (i / 6) * Math.PI
        points.push([cx + Math.cos(a) * w, spring + Math.sin(a) * w])
      }
      points.push([cx + w, spring], [cx + w, 0])
      if (piers) b.solidBox(cx - w - left, height, depth, { at: [(left + cx - w) / 2, y + height / 2, bridgeZ] })
      left = cx + w
    }
    if (piers) b.solidBox(width / 2 - left, height, depth, { at: [(left + width / 2) / 2, y + height / 2, bridgeZ] })
    points.push([width / 2, 0], [width / 2, height], [-width / 2, height])
    b.extrude(points, depth, { at: [0, y, bridgeZ], color, solid: false })
  }
  const spaced = (count, width, w, spring) =>
    Array.from({ length: count }, (_, i) => [-width / 2 + (width / count) * (i + 0.5), w, spring])

  // River under the bridge
  b.box(34, 0.05, 4.4, { at: [0, 0.03, bridgeZ], color: 'water', solid: false })

  arcade({ y: 0, height: 5.5, width: 26, depth: 3, color: 'sandstoneDeep', piers: true,
    arches: [[-9.6, 1.8, 2.8], [-4.8, 1.8, 2.8], [0, 2, 2.9], [4.8, 1.8, 2.8], [9.6, 1.8, 2.8]] })
  arcade({ y: 5.5, height: 3.6, width: 26, depth: 2.6, color: 'sandstone', arches: spaced(7, 26, 1.3, 1.4) })
  arcade({ y: 9.1, height: 1.5, width: 24, depth: 2.2, color: 'sandstone', arches: spaced(14, 24, 0.55, 0.4) })
  b.box(24.4, 0.35, 2.4, { at: [0, 10.78, bridgeZ], color: 'sand', solid: false })

  // Lavender rows on green strips
  for (let i = 0; i < 6; i++) {
    const z = 3 + i * 1.35
    b.box(13, 0.06, 1, { at: [0, 0.03, z], color: 'leafDeep', solid: false })
    b.cylinder(0.52, 0.52, 12.4, {
      at: [0, 0.04, z], rot: [0, 0, Math.PI / 2], scale: [0.36, 1, 1], segments: 6,
      color: i % 2 ? 'lavender' : 'lavenderDeep'
    })
  }

  // Cypresses at the corners of the field
  for (const x of [-8.2, 8.2]) {
    b.cylinder(0.12, 0.15, 0.8, { at: [x, 0.4, 7], segments: 5, color: 'bark', solid: false })
    b.cone(0.75, 4.6, { at: [x, 3, 7], segments: 7, color: 'cypress' })
  }
}
