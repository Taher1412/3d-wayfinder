/**
 * CROUS & Banque: a modern CROUS block with strip windows and a resto U
 * terrace, a bank with its blue fascia and cash machine, and a bus shelter
 * for the transport pass.
 */
export default function crous(b) {
  // Forecourt
  b.box(20, 0.05, 10, { at: [0, 0.025, 4], color: 'linen', solid: false })

  // CROUS block: walls, three floors of strip windows, red crown, glazed ground floor, awning
  b.box(9, 7.5, 6, { at: [-4, 3.75, -2], color: 'paper' })
  for (const y of [3.3, 4.9, 6.5]) b.box(8.2, 0.8, 0.06, { at: [-4, y, 1.03], color: 'blueSoft', solid: false })
  b.box(9.2, 0.6, 6.2, { at: [-4, 7.8, -2], color: 'red', solid: false })
  b.box(8.2, 2, 0.06, { at: [-4, 1.2, 1.03], color: 'blueDeep', solid: false })
  b.frustum(8.4, 1.6, 8.4, 0.2, 0.5, { at: [-4, 2.55, 1.8], rot: [-0.25, 0, 0], color: 'red', solid: false })
  b.box(2.2, 1, 2.2, { at: [-6, 8.6, -3], color: 'stone', solid: false })

  // Terrace: tables under red and white parasols
  for (const [x, color] of [[-6.2, 'red'], [-2.2, 'white']]) {
    b.cylinder(0.05, 0.05, 2.4, { at: [x, 1.2, 4.2], segments: 5, color: 'slate', solid: false })
    b.cone(1.5, 0.7, { at: [x, 2.55, 4.2], segments: 8, color, solid: false })
    b.cylinder(0.7, 0.7, 0.08, { at: [x, 0.8, 4.2], segments: 10, color: 'white', solid: false })
    b.solidBox(1.2, 0.9, 1.2, { at: [x, 0.45, 4.2] })
  }

  // Bank: stone walls, blue fascia, glass door, cash machine
  b.box(6.5, 4.6, 5.5, { at: [4.6, 2.3, -2.2], color: 'linen' })
  b.box(6.7, 0.9, 0.2, { at: [4.6, 3.8, 0.6], color: 'blue', solid: false })
  b.box(6.7, 0.25, 5.7, { at: [4.6, 4.7, -2.2], color: 'stone', solid: false })
  b.box(1.6, 2.6, 0.06, { at: [3.2, 1.3, 0.53], color: 'blueDeep', solid: false })
  b.box(1.1, 1.7, 0.3, { at: [6.1, 1.35, 0.6], color: 'slate', solid: false })
  b.box(0.6, 0.45, 0.05, { at: [6.1, 1.65, 0.77], color: 'blueSoft', solid: false })
  b.box(0.7, 0.06, 0.12, { at: [6.1, 1.05, 0.8], color: 'white', solid: false })

  // Bus shelter: glass back, blue roof, bench and a stop sign pole
  b.box(3.6, 2.3, 0.08, { at: [6.5, 1.25, 6.4], color: 'blueSoft', solid: false })
  b.box(3.9, 0.15, 1.6, { at: [6.5, 2.45, 7], color: 'blue', solid: false })
  for (const x of [4.75, 8.25]) b.box(0.1, 2.4, 0.1, { at: [x, 1.2, 7.7], color: 'slate', solid: false })
  b.box(2.4, 0.12, 0.5, { at: [6.5, 0.5, 6.7], color: 'bark', solid: false })
  b.solidBox(3.9, 2.4, 1.6, { at: [6.5, 1.2, 7] })
  b.cylinder(0.05, 0.05, 2.8, { at: [9.2, 1.4, 7.9], segments: 5, color: 'slate', solid: false })
  b.cylinder(0.35, 0.35, 0.06, { at: [9.2, 2.8, 7.9], rot: [Math.PI / 2, 0, 0], segments: 10, color: 'red', solid: false })
}
