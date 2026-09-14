import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { buildModel } from '../models/index.js'
import { flatMaterial, palette } from '../models/palette.js'
import { toColliderDescs } from '../physics/colliders.js'
import { compassToYaw, compassDirection } from '../utils/compass.js'
import { createContactShadow } from './contactShadow.js'
import NamePlate from './NamePlate.js'

const damp = (rate, dt) => 1 - Math.exp(-rate * dt)

function dashedRing(radius) {
  const count = Math.max(16, Math.round((Math.PI * 2 * radius) / 1.5))
  const step = (Math.PI * 2) / count
  const dashes = []
  for (let i = 0; i < count; i++) dashes.push(new THREE.RingGeometry(radius - 0.25, radius, 2, 1, i * step, step * 0.55))
  return mergeGeometries(dashes).rotateX(-Math.PI / 2)
}

/**
 * One landmark from data: merged model, static colliders, contact shadow,
 * trigger zone on the ground, name plate, and the panel payload.
 */
export default class Landmark {
  constructor({ data, scene, physics }) {
    this.data = data
    this.id = data.id
    this.name = data.name
    this.kind = data.kind
    this.panel = data.panel
    this.radius = data.trigger?.radius ?? 8
    this.active = false

    const [x, y, z] = data.position
    const facing = data.facing ?? 180
    const yaw = compassToYaw(facing)
    this.position = new THREE.Vector3(x, y, z)
    const accent = this.kind === 'admin' ? palette.red : palette.blue

    // Model: one merged mesh
    const { geometry, colliders } = buildModel(data)
    this.mesh = new THREE.Mesh(geometry, flatMaterial)
    this.mesh.position.copy(this.position)
    this.mesh.rotation.y = yaw
    this.mesh.matrixAutoUpdate = false
    this.mesh.updateMatrix()
    scene.add(this.mesh)

    // Contact shadow sized from the footprint
    const box = geometry.boundingBox
    const center = new THREE.Vector3((box.min.x + box.max.x) / 2, 0, (box.min.z + box.max.z) / 2).applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw)
    const shadow = createContactShadow((box.max.x - box.min.x) * 1.35, (box.max.z - box.min.z) * 1.35, 0.28)
    shadow.position.set(x + center.x, 0.02, z + center.z)
    shadow.rotation.y = yaw
    scene.add(shadow)

    // Physics
    const q = new THREE.Quaternion().setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yaw)
    physics.addFixed(toColliderDescs(physics.RAPIER, colliders), data.position, { x: q.x, y: q.y, z: q.z, w: q.w })

    // Trigger zone: dashed ring plus a fill that lights up when the car is inside
    this.ringMaterial = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.4, depthWrite: false })
    this.ring = new THREE.Mesh(dashedRing(this.radius), this.ringMaterial)
    this.fillMaterial = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false })
    const fill = new THREE.Mesh(new THREE.CircleGeometry(this.radius, 48).rotateX(-Math.PI / 2), this.fillMaterial)
    this.ring.position.set(x, 0.035, z)
    fill.position.set(x, 0.03, z)
    this.ring.renderOrder = fill.renderOrder = 2
    scene.add(this.ring, fill)

    // Name plate on the approach side, a little off-axis so it doesn't block the view
    const [px, pz] = compassDirection(facing + 32)
    this.plate = new NamePlate(this.name, this.kind)
    this.plate.group.position.set(x + px * (this.radius + 0.8), 0, z + pz * (this.radius + 0.8))
    scene.add(this.plate.group)

    // Where R drops the car: in front of the zone, facing the landmark
    const [fx, fz] = compassDirection(facing)
    const distance = this.radius + 4
    this.respawn = {
      position: [x + fx * distance, 1.2, z + fz * distance],
      heading: Math.atan2(-fx, -fz)
    }
  }

  distanceSquared(x, z) {
    return (x - this.position.x) ** 2 + (z - this.position.z) ** 2
  }

  setActive(active) {
    this.active = active
  }

  update(dt, camera) {
    const k = damp(8, dt)
    this.ringMaterial.opacity += ((this.active ? 0.9 : 0.4) - this.ringMaterial.opacity) * k
    this.fillMaterial.opacity += ((this.active ? 0.1 : 0) - this.fillMaterial.opacity) * k
    this.ring.rotation.y += dt * (this.active ? 0.35 : 0.06)
    this.plate.update(camera)
  }
}
