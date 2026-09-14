import * as THREE from 'three'
import ModelBuilder from '../models/ModelBuilder.js'
import { flatMaterial } from '../models/palette.js'
import { outline, regions, spawn } from '../data/regions.js'
import { landmarks } from '../data/landmarks.js'
import { props } from '../data/props.js'
import { pointInPolygon, distanceToEdges, seededRandom } from '../utils/polygon.js'
import { shadowMaterial } from './contactShadow.js'

// Tree kinds a region can ask for in `decor.kinds`. Each draws at [x, z] with scale s.
const TREES = {
  round(b, x, z, s) {
    b.cylinder(0.14 * s, 0.2 * s, 1.3 * s, { at: [x, 0.65 * s, z], segments: 6, color: 'bark', solid: false })
    b.sphere(1.05 * s, { at: [x, 1.95 * s, z], color: 'leaf', solid: false })
    b.sphere(0.7 * s, { at: [x + 0.45 * s, 2.5 * s, z - 0.2 * s], color: 'leafDeep', solid: false })
  },
  fir(b, x, z, s) {
    b.cylinder(0.12 * s, 0.16 * s, 0.9 * s, { at: [x, 0.45 * s, z], segments: 5, color: 'bark', solid: false })
    b.cone(1.1 * s, 2.2 * s, { at: [x, 1.8 * s, z], segments: 7, color: 'leafDeep', solid: false })
    b.cone(0.75 * s, 1.8 * s, { at: [x, 2.9 * s, z], segments: 7, color: 'cypress', solid: false })
  },
  cypress(b, x, z, s) {
    b.cylinder(0.1 * s, 0.12 * s, 0.6 * s, { at: [x, 0.3 * s, z], segments: 5, color: 'bark', solid: false })
    b.cone(0.55 * s, 3.8 * s, { at: [x, 2.3 * s, z], segments: 7, color: 'cypress', solid: false })
  },
  olive(b, x, z, s) {
    b.cylinder(0.18 * s, 0.26 * s, 1 * s, { at: [x, 0.5 * s, z], segments: 6, color: 'bark', solid: false })
    b.sphere(1.1 * s, { at: [x, 1.55 * s, z], scale: [1.25, 0.7, 1.25], color: 'olive', solid: false })
  }
}

const MIN_SPACING = 5

/**
 * Trees scattered per region from `decor` in regions.js, deterministically,
 * away from the coast, landmark zones, the start and the props. One merged mesh,
 * instanced blob shadows, and a trunk collider each.
 */
export default class Decor {
  constructor({ scene, physics }) {
    const builder = new ModelBuilder()
    const placed = []
    const keepClear = [
      ...landmarks.map((l) => ({ at: [l.position[0], l.position[2]], radius: l.trigger.radius + 7 })),
      ...props.map((p) => ({ at: [p.position[0], p.position[2]], radius: (p.radius ?? (p.count * (p.spacing ?? 1)) / 2) + 8 })),
      { at: [spawn.position[0], spawn.position[2]], radius: 14 }
    ]

    for (const region of regions) {
      const { trees = 0, kinds = ['round'] } = region.decor ?? {}
      const random = seededRandom(region.id)
      const xs = region.polygon.map((p) => p[0]), zs = region.polygon.map((p) => p[1])
      const [minX, maxX, minZ, maxZ] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]
      let count = 0
      for (let attempt = 0; count < trees && attempt < trees * 60; attempt++) {
        const p = [minX + random() * (maxX - minX), minZ + random() * (maxZ - minZ)]
        if (!pointInPolygon(p, region.polygon) || distanceToEdges(p, outline) < 6) continue
        if (keepClear.some(({ at, radius }) => Math.hypot(p[0] - at[0], p[1] - at[1]) < radius)) continue
        if (placed.some((q) => Math.hypot(p[0] - q.x, p[1] - q.z) < MIN_SPACING)) continue
        const kind = kinds[Math.floor(random() * kinds.length)]
        const scale = 0.8 + random() * 0.45
        TREES[kind](builder, p[0], p[1], scale)
        placed.push({ x: p[0], z: p[1], scale })
        count++
      }
    }
    if (!placed.length) return

    this.mesh = new THREE.Mesh(builder.build().geometry, flatMaterial)
    this.mesh.matrixAutoUpdate = false
    scene.add(this.mesh)

    const shadows = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), shadowMaterial(0.22), placed.length)
    const matrix = new THREE.Matrix4()
    placed.forEach(({ x, z, scale }, i) => shadows.setMatrixAt(i, matrix.makeScale(3 * scale, 1, 3 * scale).setPosition(x, 0.02, z)))
    shadows.renderOrder = 1
    scene.add(shadows)

    const { RAPIER } = physics
    physics.addFixed(placed.map(({ x, z, scale }) => RAPIER.ColliderDesc.cylinder(1.5, 0.28 * scale).setTranslation(x, 1.5, z)))
    this.count = placed.length
  }
}
