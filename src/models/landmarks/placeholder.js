/** Stand-in for landmarks whose model isn't built yet: a plinth and a column. */
export default function placeholder(b, { landmark }) {
  const accent = landmark.kind === 'admin' ? 'red' : 'blue'
  b.cylinder(3.2, 3.4, 0.6, { at: [0, 0.3, 0], color: 'stone', segments: 12 })
  b.cylinder(2, 2.2, 7, { at: [0, 4.1, 0], color: accent, segments: 12 })
  b.cylinder(2.5, 2.5, 0.5, { at: [0, 7.85, 0], color: 'paper', segments: 12 })
}
