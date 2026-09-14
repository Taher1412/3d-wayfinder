import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { outline, regions } from '../data/regions.js'
import { flatMaterial, palette } from '../models/palette.js'

const THICKNESS = 3
const CURB = { height: 0.45, width: 0.9 }
const _color = new THREE.Color()

// Map points are [x, z]. Shapes live in XY with y = -z, so rotateX(-90°) lays them flat with +Z extruding up.
const toShape = (points) => new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)))

function prepare(geometry, color) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry
  for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name)
  _color.set(color)
  const colors = new Float32Array(g.attributes.position.count * 3)
  for (let i = 0; i < colors.length; i += 3) colors.set([_color.r, _color.g, _color.b], i)
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return g
}

/** Edges of the outline with their outward normal. */
export function coastEdges() {
  const cx = outline.reduce((s, p) => s + p[0], 0) / outline.length
  const cz = outline.reduce((s, p) => s + p[1], 0) / outline.length
  return outline.map((a, i) => {
    const b = outline[(i + 1) % outline.length]
    const dx = b[0] - a[0], dz = b[1] - a[1]
    const length = Math.hypot(dx, dz)
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    let normal = [dz / length, -dx / length]
    if (normal[0] * (mid[0] - cx) + normal[1] * (mid[1] - cz) < 0) normal = [-normal[0], -normal[1]]
    return { a, b, mid, length, normal, yaw: Math.atan2(-dz, dx) }
  })
}

/** Is map point [x, z] on the outline (so a region edge there is coast, not a border)? */
function onCoast([x, z]) {
  return coastEdges().some(({ a, b, length }) => {
    const cross = Math.abs((b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0])) / length
    return cross < 0.5
  })
}

function dashedLine(a, b, width = 0.28, dash = 1.4, gap = 1.1) {
  const dx = b[0] - a[0], dz = b[1] - a[1]
  const length = Math.hypot(dx, dz)
  const yaw = Math.atan2(-dz, dx)
  const dashes = []
  for (let d = gap / 2; d + dash < length; d += dash + gap) {
    const t = (d + dash / 2) / length
    dashes.push(
      new THREE.PlaneGeometry(dash, width).rotateX(-Math.PI / 2).rotateY(yaw).translate(a[0] + dx * t, 0.015, a[1] + dz * t)
    )
  }
  return dashes
}

/**
 * The map floor: France as an extruded hexagon, region zones tinted on top,
 * dashed borders between them and a low quay along the coast. One draw call.
 */
export default class Ground {
  constructor({ scene, physics }) {
    const parts = []

    const base = new THREE.ExtrudeGeometry(toShape(outline), { depth: THICKNESS, bevelEnabled: false })
    parts.push(prepare(base.rotateX(-Math.PI / 2).translate(0, -THICKNESS - 0.02, 0), palette.linen))

    const borders = new Set()
    for (const region of regions) {
      parts.push(prepare(new THREE.ShapeGeometry(toShape(region.polygon)).rotateX(-Math.PI / 2), region.color))
      region.polygon.forEach((a, i) => {
        const b = region.polygon[(i + 1) % region.polygon.length]
        const key = [a, b].map(String).sort().join('|')
        if (borders.has(key) || (onCoast(a) && onCoast(b))) return
        borders.add(key)
        for (const dash of dashedLine(a, b)) parts.push(prepare(dash, palette.stone))
      })
    }

    const { RAPIER } = physics
    const walls = []
    for (const edge of coastEdges()) {
      const inset = CURB.width / 2
      const x = edge.mid[0] - edge.normal[0] * inset
      const z = edge.mid[1] - edge.normal[1] * inset
      const curb = new THREE.BoxGeometry(edge.length + CURB.width, CURB.height, CURB.width)
      parts.push(prepare(curb.rotateY(edge.yaw).translate(x, CURB.height / 2 - 0.02, z), palette.white))

      // Invisible wall well above the curb so the car can't hop into the sea
      const q = new THREE.Quaternion().setFromAxisAngle(THREE.Object3D.DEFAULT_UP, edge.yaw)
      walls.push(
        RAPIER.ColliderDesc.cuboid(edge.length / 2 + 1, 3, CURB.width / 2)
          .setTranslation(x, 2, z)
          .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
          .setFriction(0.1)
          .setRestitution(0.3)
      )
    }

    this.mesh = new THREE.Mesh(mergeGeometries(parts), flatMaterial)
    this.mesh.matrixAutoUpdate = false
    scene.add(this.mesh)

    // Physics: one slab under the whole map plus the coast walls
    const xs = outline.map((p) => p[0]), zs = outline.map((p) => p[1])
    const halfX = (Math.max(...xs) - Math.min(...xs)) / 2 + 10
    const halfZ = (Math.max(...zs) - Math.min(...zs)) / 2 + 10
    const centerX = (Math.max(...xs) + Math.min(...xs)) / 2
    const centerZ = (Math.max(...zs) + Math.min(...zs)) / 2
    physics.addFixed([RAPIER.ColliderDesc.cuboid(halfX, 1, halfZ).setTranslation(centerX, -1, centerZ).setFriction(0.8), ...walls])
  }
}
