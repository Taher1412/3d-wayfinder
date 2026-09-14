/**
 * Turns the plain collider descriptors produced by ModelBuilder into Rapier ColliderDescs.
 */
export function toColliderDescs(RAPIER, descriptors, { friction = 0.5, restitution = 0.1 } = {}) {
  const descs = []
  for (const d of descriptors) {
    let desc = null
    if (d.type === 'cuboid') {
      const [x, y, z, w] = d.quaternion
      desc = RAPIER.ColliderDesc.cuboid(...d.halfExtents)
        .setTranslation(...d.position)
        .setRotation({ x, y, z, w })
    } else if (d.type === 'hull') {
      desc = RAPIER.ColliderDesc.convexHull(d.points instanceof Float32Array ? d.points : new Float32Array(d.points))
    }
    if (desc) descs.push(desc.setFriction(friction).setRestitution(restitution))
  }
  return descs
}
