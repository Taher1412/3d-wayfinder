/**
 * Préfecture: a classical civic building with a slate mansard roof, a
 * columned portico on steps you can drive up, rows of windows, and the
 * French and European flags out front.
 */
export default function prefecture(b) {
  // Forecourt
  b.box(17, 0.05, 9, { at: [0, 0.025, 5.5], color: 'linen', solid: false })

  // Main block: stone plinth, rendered walls, cornice, mansard and chimneys
  b.box(14, 5.2, 6, { at: [0, 2.6, -1], color: 'paper' })
  b.box(14.2, 1, 6.2, { at: [0, 0.5, -1], color: 'stone', solid: false })
  b.box(14.5, 0.35, 6.5, { at: [0, 5.35, -1], color: 'white', solid: false })
  b.frustum(14.3, 6.3, 12.2, 3.6, 2, { at: [0, 6.5, -1], color: 'slate', solid: false })
  for (const x of [-4.5, 4.5]) b.box(0.6, 1.2, 0.6, { at: [x, 7.9, -1], color: 'stone', solid: false })

  // Windows on both floors, leaving the middle for the portico
  for (const x of [-6, -4.7, -3.4, 3.4, 4.7, 6]) {
    for (const y of [1.9, 4]) b.box(0.72, 1.3, 0.06, { at: [x, y, 2.03], color: 'blueDeep', solid: false })
  }

  // Portico: avant-corps, three steps, four columns, entablature and pediment
  b.box(5.2, 6, 1, { at: [0, 3, 2.4], color: 'white', solid: false })
  for (let i = 0; i < 3; i++) {
    b.box(6.2 - i * 0.6, 0.3, 3.6 - i * 0.6, { at: [0, 0.15 + i * 0.3, 4.2 - i * 0.3], color: 'stone' })
  }
  for (const x of [-1.8, -0.6, 0.6, 1.8]) {
    b.cylinder(0.26, 0.3, 4.3, { at: [x, 3.05, 3.7], segments: 8, color: 'white' })
  }
  b.box(4.9, 0.55, 1.5, { at: [0, 5.45, 3.5], color: 'white', solid: false })
  b.extrude([[-2.7, 0], [2.7, 0], [0, 1.25]], 1.5, { at: [0, 5.72, 3.5], color: 'paper', solid: false })
  b.box(1.4, 2.4, 0.08, { at: [0, 2.1, 2.95], color: 'blueDeep', solid: false }) // doors

  // Flagpoles with the tricolore and the EU flag
  for (const side of [-1, 1]) {
    b.cylinder(0.06, 0.09, 6.4, { at: [side * 6, 3.2, 7], segments: 6, color: 'slate', solid: false })
    b.solidBox(0.3, 6.4, 0.3, { at: [side * 6, 3.2, 7] })
  }
  ;['blue', 'white', 'red'].forEach((color, i) => {
    b.box(0.62, 1.25, 0.05, { at: [-5.6 + i * 0.62, 5.7, 7], color, solid: false })
  })
  b.box(1.86, 1.25, 0.05, { at: [6.99, 5.7, 7], color: 'blueDeep', solid: false })
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    b.box(0.09, 0.09, 0.07, { at: [6.99 + Math.cos(a) * 0.4, 5.7 + Math.sin(a) * 0.4, 7], color: 'gold', solid: false })
  }
}
