import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { palette } from './palette.js'

const _matrix = new THREE.Matrix4()
const _position = new THREE.Vector3()
const _quaternion = new THREE.Quaternion()
const _euler = new THREE.Euler()
const _scale = new THREE.Vector3()
const _color = new THREE.Color()

/**
 * Collects primitives, paints them with palette colours and merges them into
 * one geometry (one draw call). Solid primitives also produce collider
 * descriptors: a cuboid for boxes, a convex hull for everything else.
 *
 * Common options for every primitive:
 *   at     [x, y, z]      position (model front faces +Z)
 *   rot    [x, y, z]      Euler rotation in radians
 *   scale  number | [x, y, z]
 *   color  palette key or any CSS colour
 *   solid  false to skip collision (decoration)
 */
export default class ModelBuilder {
  constructor() {
    this.parts = []
    this.colliders = []
  }

  add(geometry, { at = [0, 0, 0], rot = [0, 0, 0], scale = 1, color = 'stone', solid = true } = {}) {
    let g = geometry.index ? geometry.toNonIndexed() : geometry
    if (g !== geometry) geometry.dispose()
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal') g.deleteAttribute(name)
    }
    _scale.set(...(Array.isArray(scale) ? scale : [scale, scale, scale]))
    _matrix.compose(_position.fromArray(at), _quaternion.setFromEuler(_euler.set(...rot)), _scale)
    g.applyMatrix4(_matrix)
    if (!g.attributes.normal) g.computeVertexNormals()

    _color.set(palette[color] ?? color)
    const count = g.attributes.position.count
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) colors.set([_color.r, _color.g, _color.b], i * 3)
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    this.parts.push({ geometry: g, solid })
    return g
  }

  box(width, height, depth, options = {}) {
    const { solid = true, ...rest } = options
    const g = this.add(new THREE.BoxGeometry(width, height, depth), { ...rest, solid: false })
    if (solid) this.solidBox(width, height, depth, options)
    return g
  }

  cylinder(radiusTop, radiusBottom, height, options = {}) {
    return this.add(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, options.segments ?? 8), options)
  }

  cone(radius, height, options = {}) {
    return this.add(new THREE.ConeGeometry(radius, height, options.segments ?? 8), options)
  }

  sphere(radius, options = {}) {
    return this.add(new THREE.IcosahedronGeometry(radius, options.detail ?? 0), options)
  }

  /** Revolve [radius, y] points around Y. */
  lathe(points, options = {}) {
    const profile = points.map(([r, y]) => new THREE.Vector2(r, y))
    return this.add(new THREE.LatheGeometry(profile, options.segments ?? 10), options)
  }

  /** Extrude an [x, y] outline along Z, centred on z = 0. */
  extrude(points, depth, options = {}) {
    const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }).translate(0, 0, -depth / 2)
    return this.add(g, options)
  }

  /** Invisible collision box, e.g. to keep an arch passable or simplify a lattice. */
  solidBox(width, height, depth, { at = [0, 0, 0], rot = [0, 0, 0], scale = 1 } = {}) {
    const s = Array.isArray(scale) ? scale : [scale, scale, scale]
    _quaternion.setFromEuler(_euler.set(...rot))
    this.colliders.push({
      type: 'cuboid',
      halfExtents: [(width * s[0]) / 2, (height * s[1]) / 2, (depth * s[2]) / 2],
      position: [...at],
      quaternion: _quaternion.toArray()
    })
  }

  /** Merge everything, apply the landmark scale and return geometry + colliders. */
  build(scale = 1) {
    const geometry = mergeGeometries(this.parts.map((p) => p.geometry))
    for (const p of this.parts) p.geometry.dispose()
    geometry.scale(scale, scale, scale)
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()

    const colliders = this.colliders.map((c) => ({
      ...c,
      halfExtents: c.halfExtents.map((v) => v * scale),
      position: c.position.map((v) => v * scale)
    }))
    let offset = 0
    for (const part of this.parts) {
      const count = part.geometry.attributes.position.count
      if (part.solid) {
        colliders.push({ type: 'hull', points: geometry.attributes.position.array.slice(offset * 3, (offset + count) * 3) })
      }
      offset += count
    }
    return { geometry, colliders }
  }
}
