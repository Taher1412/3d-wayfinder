/**
 * Rapier world with a fixed timestep.
 *
 * Rapier is injected rather than imported so it can live in its own chunk
 * (the compat build inlines ~2 MB of wasm) and so node scripts can reuse this.
 */
export default class Physics {
  constructor(RAPIER, { gravity = -20, step = 1 / 60 } = {}) {
    this.RAPIER = RAPIER
    this.world = new RAPIER.World({ x: 0, y: gravity, z: 0 })
    this.world.timestep = step
    this.step = step
    this.accumulator = 0
    this.alpha = 0 // 0..1 interpolation factor between the last two steps
    this.beforeStep = new Set()
    this.afterStep = new Set()
  }

  update(delta) {
    this.accumulator += delta
    let steps = 0
    while (this.accumulator >= this.step && steps < 4) {
      for (const fn of this.beforeStep) fn(this.step)
      this.world.step()
      for (const fn of this.afterStep) fn(this.step)
      this.accumulator -= this.step
      steps++
    }
    if (steps === 4) this.accumulator = 0 // too far behind: drop time rather than spiral
    this.alpha = this.accumulator / this.step
  }

  /** Fixed body holding a list of Rapier ColliderDescs. */
  addFixed(colliderDescs, position = [0, 0, 0], rotation = null) {
    const { RAPIER, world } = this
    const desc = RAPIER.RigidBodyDesc.fixed().setTranslation(...position)
    if (rotation) desc.setRotation(rotation)
    const body = world.createRigidBody(desc)
    for (const c of colliderDescs) world.createCollider(c, body)
    return body
  }
}
