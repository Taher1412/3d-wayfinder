/**
 * Limoges: Cathédrale Saint-Étienne (nave, aisles, transept, apse and the
 * west bell tower with its octagonal stages) and a giant porcelain cup and
 * saucer on the square in front.
 */
export default function limoges(b) {
  // Square
  b.box(15, 0.05, 21, { at: [0, 0.025, 0], color: 'linen', solid: false })

  // Nave, aisles and roofs
  b.box(4.2, 4.6, 11, { at: [0, 2.3, -1.5], color: 'stone' })
  b.extrude([[-2.4, 0], [2.4, 0], [0, 2.3]], 11.2, { at: [0, 4.6, -1.5], color: 'slate', solid: false })
  for (const side of [-1, 1]) {
    b.box(1.6, 2.8, 10, { at: [side * 2.9, 1.4, -1.5], color: 'linen' })
    // Buttress piers along the aisles, each throwing a flying arm up to the nave wall
    for (let i = 0; i < 4; i++) {
      const z = -5.6 + i * 2.7
      b.box(0.55, 3.3, 0.7, { at: [side * 3.95, 1.65, z], color: 'stone' })
      b.strut([side * 3.95, 3.1, z], [side * 2.1, 4.3, z], 0.18, 0.14, { color: 'stone', solid: false })
    }
  }

  // Transept with its own roof and a rose window on each end
  b.box(10, 4.3, 3.2, { at: [0, 2.15, -3.4], color: 'stone' })
  b.extrude([[-1.8, 0], [1.8, 0], [0, 1.8]], 10.2, { at: [0, 4.3, -3.4], rot: [0, Math.PI / 2, 0], color: 'slate', solid: false })
  for (const side of [-1, 1]) {
    b.cylinder(0.8, 0.8, 0.1, { at: [side * 5.02, 2.9, -3.4], rot: [0, 0, Math.PI / 2], segments: 10, color: 'blueSoft', solid: false })
  }

  // Apse at the east end
  b.cylinder(2.1, 2.1, 4.2, { at: [0, 2.1, -7], segments: 10, color: 'stone' })
  b.cone(2.3, 2, { at: [0, 5.2, -7], segments: 10, color: 'slate', solid: false })

  // West bell tower: square base, two octagonal stages, pointed roof
  b.box(3.2, 7.2, 3.2, { at: [0, 3.6, 5.6], color: 'stone' })
  b.box(1.2, 2.4, 0.1, { at: [0, 1.2, 7.22], color: 'slate', solid: false }) // portal
  b.cylinder(1.35, 1.6, 3.2, { at: [0, 8.8, 5.6], segments: 8, color: 'linen', solid: false })
  b.cylinder(1, 1.25, 2.6, { at: [0, 11.7, 5.6], segments: 8, color: 'stone', solid: false })
  b.cone(1.1, 2.4, { at: [0, 14.2, 5.6], segments: 8, color: 'slate', solid: false })
  b.cone(0.12, 0.6, { at: [0, 15.7, 5.6], segments: 4, color: 'gold', solid: false })

  // Porcelain: saucer and cup as closed lathe profiles (so the rim has thickness), blue band, handle
  const cup = [5.2, 0, 6.2]
  const at = (y, dx = 0) => [cup[0] + dx, cup[1] + y, cup[2]]
  b.lathe([[0.01, 0], [1.4, 0], [2.4, 0.38], [2.3, 0.5], [1.3, 0.24], [0.01, 0.24]], { at: at(0), segments: 14, color: 'porcelain' })
  b.lathe([[0.01, 0.24], [0.9, 0.24], [1.5, 1.4], [1.8, 2.7], [1.62, 2.7], [1.35, 1.5], [0.8, 0.5], [0.01, 0.5]], { at: at(0), segments: 14, color: 'porcelain' })
  b.cylinder(1.79, 1.72, 0.3, { at: at(2.3), segments: 14, open: true, color: 'porcelainBlue', solid: false })
  b.cylinder(1.83, 1.81, 0.07, { at: at(2.68), segments: 14, open: true, color: 'gold', solid: false })
  b.arc(0.62, 0.15, Math.PI, { at: at(1.6, 1.6), rot: [0, 0, -Math.PI / 2], segments: 8, color: 'porcelain', solid: false })
}
