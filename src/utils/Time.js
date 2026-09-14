/**
 * Frame clock. `delta` is clamped so a backgrounded tab doesn't
 * hand the physics a 5-second step when it comes back.
 */
export default class Time {
  constructor() {
    this.start = performance.now()
    this.current = this.start
    this.elapsed = 0
    this.delta = 1 / 60
  }

  update() {
    const now = performance.now()
    this.raw = (now - this.current) / 1000
    this.delta = Math.min(this.raw, 1 / 20)
    this.elapsed = (now - this.start) / 1000
    this.current = now
  }
}
