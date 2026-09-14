/**
 * Mont-Saint-Michel: a granite cone ringed by ramparts, a spiral of houses
 * climbing to the abbey, and the spire with its golden archangel. Tide water,
 * wet sand and the footbridge sit flat around it.
 */
export default function montSaintMichel(b) {
  const profile = [[7, 0], [6.4, 1.2], [4.8, 3.2], [2.6, 4.8], [0, 5.2]]
  const rockHeight = (r) => {
    for (let i = 1; i < profile.length; i++) {
      const [r0, y0] = profile[i - 1], [r1, y1] = profile[i]
      if (r <= r0 && r >= r1) return y0 + ((r0 - r) / (r0 - r1)) * (y1 - y0)
    }
    return 5.2
  }

  // The bay: sand, tide water and the footbridge heading out front
  b.cylinder(11.5, 11.5, 0.05, { at: [0, 0.025, 0], segments: 16, color: 'sand', solid: false })
  b.cylinder(8.6, 8.6, 0.07, { at: [0, 0.04, 0], segments: 16, color: 'water', solid: false })
  b.box(1.4, 0.2, 5.2, { at: [0, 0.1, 9.6], color: 'stone', solid: false })

  // Rock and ramparts
  b.lathe(profile, { segments: 9, color: 'granite' })
  b.cylinder(7.1, 7.3, 1.5, { at: [0, 0.75, 0], segments: 14, color: 'stone' })
  for (let i = 0; i < 6; i++) {
    const a = -1.2 + i * 0.5
    b.cylinder(0.55, 0.6, 2.1, { at: [Math.sin(a) * 7.2, 1.05, Math.cos(a) * 7.2], segments: 7, color: 'stone', solid: false })
  }

  // Village houses spiralling up the slope, each with a slate pyramid roof
  for (let i = 0; i < 11; i++) {
    const a = 0.2 + i * 0.62
    const r = 5.9 - i * 0.33
    const y = rockHeight(r) + 0.2
    const at = [Math.sin(a) * r, y + 0.5, Math.cos(a) * r]
    b.box(1.1, 1.1, 1, { at, rot: [0, a, 0], color: i % 3 ? 'paper' : 'linen', solid: false })
    b.cone(0.82, 0.7, { at: [at[0], y + 1.4, at[2]], rot: [0, a + Math.PI / 4, 0], segments: 4, color: 'slate', solid: false })
  }

  // Abbey on the summit: nave, the Merveille block behind, and the roof
  b.box(3, 2.2, 5, { at: [0, 6.2, -0.4], color: 'stone' })
  b.extrude([[-1.7, 0], [1.7, 0], [0, 1.3]], 5.2, { at: [0, 7.3, -0.4], color: 'slate', solid: false })
  b.box(4.8, 3, 2.4, { at: [0, 5, -3.3], color: 'linen' })

  // Bell tower, spire and Saint Michel
  b.box(1.6, 2.4, 1.6, { at: [0, 8.4, 1.3], color: 'stone', solid: false })
  b.cone(0.95, 5.6, { at: [0, 12.4, 1.3], segments: 8, color: 'slate', solid: false })
  b.cone(0.2, 0.9, { at: [0, 15.6, 1.3], segments: 5, color: 'gold', solid: false })
}
