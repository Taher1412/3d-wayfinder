import * as THREE from 'three'

let texture = null

/** A soft round blob drawn once to a canvas: cheap contact shadows, no shadow maps. */
export function shadowTexture() {
  if (texture) return texture
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(0,0,0,1)')
  gradient.addColorStop(0.45, 'rgba(0,0,0,0.75)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  texture = new THREE.CanvasTexture(canvas)
  return texture
}

export function shadowMaterial(opacity = 0.35) {
  return new THREE.MeshBasicMaterial({
    map: shadowTexture(),
    color: '#3a3548',
    transparent: true,
    opacity,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  })
}

const plane = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)

/** Flat blob of `width` × `depth` lying just above the ground. */
export function createContactShadow(width, depth = width, opacity = 0.35) {
  const mesh = new THREE.Mesh(plane, shadowMaterial(opacity))
  mesh.scale.set(width, 1, depth)
  mesh.position.y = 0.02
  mesh.renderOrder = 1
  return mesh
}
