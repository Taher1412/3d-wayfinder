import * as THREE from 'three'
import ModelBuilder from '../models/ModelBuilder.js'
import { flatMaterial } from '../models/palette.js'
import { props } from '../data/props.js'
import { compassDirection } from '../utils/compass.js'
import { seededRandom } from '../utils/polygon.js'
import { shadowMaterial } from './contactShadow.js'

const _matrix = new THREE.Matrix4()
const _position = new THREE.Vector3()
const _quaternion = new THREE.Quaternion()
const ONE = new THREE.Vector3(1, 1, 1)

// Each type: how it looks, how it collides, how heavy it is (the car weighs 12)
const TYPES = {
  cone: {
    model(b) {
      b.box(0.5, 0.06, 0.5, { at: [0, 0.03, 0], color: 'ink' })
      b.cone(0.22, 0.8, { at: [0, 0.46, 0], segments: 8, color: 'red' })
      b.cylinder(0.14, 0.17, 0.12, { at: [0, 0.4, 0], segments: 8, open: true, color: 'white' })
    },
    collider: (RAPIER) => RAPIER.ColliderDesc.cylinder(0.4, 0.22).setTranslation(0, 0.4, 0),
    mass: 0.35,
    size: 0.9
  },
  crate: {
    model(b) {
      b.box(0.8, 0.8, 0.8, { at: [0, 0.4, 0], color: 'sandstone' })
      b.box(0.82, 0.12, 0.3, { at: [0, 0.8, 0], color: 'stone' })
    },
    collider: (RAPIER) => RAPIER.ColliderDesc.cuboid(0.4, 0.4, 0.4).setTranslation(0, 0.4, 0),
    mass: 0.6,
    size: 1.2
  },
  hay: {
    model(b) {
      b.cylinder(0.55, 0.55, 1, { rot: [0, 0, Math.PI / 2], at: [0, 0.55, 0], segments: 10, color: 'sand' })
      b.cylinder(0.4, 0.4, 1.02, { rot: [0, 0, Math.PI / 2], at: [0, 0.55, 0], segments: 10, color: 'sandstoneDeep' })
    },
    collider: (RAPIER) => RAPIER.ColliderDesc.cylinder(0.5, 0.55).setTranslation(0, 0.55, 0).setRotation({ x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 }),
    mass: 2.2,
    size: 1.8
  }
}

/** Where each object of a group starts: [x, y, z, yaw]. */
function layout(group) {
  const [x0, , z0] = group.position
  const facing = group.facing ?? 0
  const [fx, fz] = compassDirection(facing)
  const [sx, sz] = compassDirection(facing + 90)
  const yaw = Math.PI - (facing * Math.PI) / 180
  const random = seededRandom(`${group.type}${x0}${z0}`)
  const out = []
  if (group.layout === 'line') {
    for (let i = 0; i < group.count; i++) out.push([x0 + fx * i * group.spacing, 0, z0 + fz * i * group.spacing, yaw])
  } else if (group.layout === 'pyramid') {
    const size = TYPES[group.type].size * 0.72
    let placed = 0
    for (let row = 0, width = Math.ceil((Math.sqrt(8 * group.count + 1) - 1) / 2); placed < group.count; row++, width--) {
      for (let i = 0; i < width && placed < group.count; i++, placed++) {
        const along = (i - (width - 1) / 2) * size * 1.02
        out.push([x0 + sx * along, row * size, z0 + sz * along, yaw])
      }
    }
  } else {
    for (let i = 0; i < group.count; i++) {
      const a = random() * Math.PI * 2, r = Math.sqrt(random()) * (group.radius ?? 5)
      out.push([x0 + Math.cos(a) * r, 0, z0 + Math.sin(a) * r, random() * Math.PI * 2])
    }
  }
  return out
}

/**
 * Dynamic props from data/props.js. One instanced mesh (plus one instanced
 * shadow) per type; transforms are only rewritten while a body is awake.
 */
export default class Props {
  constructor({ scene, physics }) {
    const { RAPIER, world } = physics
    this.types = []

    for (const [name, type] of Object.entries(TYPES)) {
      const starts = props.filter((p) => p.type === name).flatMap(layout)
      if (!starts.length) continue
      const builder = new ModelBuilder()
      type.model(builder)
      const mesh = new THREE.InstancedMesh(builder.build().geometry, flatMaterial, starts.length)
      const shadow = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), shadowMaterial(0.3), starts.length)
      mesh.frustumCulled = shadow.frustumCulled = false
      shadow.renderOrder = 1
      scene.add(mesh, shadow)

      const bodies = starts.map(([x, y, z, yaw], i) => {
        _quaternion.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yaw)
        const body = world.createRigidBody(
          RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y + 0.01, z).setRotation(_quaternion).setLinearDamping(0.3).setAngularDamping(0.6)
        )
        world.createCollider(type.collider(RAPIER).setMass(type.mass).setFriction(0.6).setRestitution(0.25), body)
        return body
      })
      this.types.push({ type, mesh, shadow, bodies })
      this.sync(this.types.at(-1), true)
    }
  }

  sync({ type, mesh, shadow, bodies }, force = false) {
    let changed = false
    bodies.forEach((body, i) => {
      if (!force && body.isSleeping()) return
      const p = body.translation()
      mesh.setMatrixAt(i, _matrix.compose(_position.set(p.x, p.y, p.z), _quaternion.copy(body.rotation()), ONE))
      const lift = Math.max(0, 1 - p.y / 3)
      shadow.setMatrixAt(i, _matrix.makeScale(type.size * (2 - lift), 1, type.size * (2 - lift)).setPosition(p.x, 0.02, p.z))
      changed = true
    })
    if (changed) mesh.instanceMatrix.needsUpdate = shadow.instanceMatrix.needsUpdate = true
  }

  update() {
    for (const group of this.types) this.sync(group)
  }
}
