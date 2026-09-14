import * as THREE from 'three'
import { palette } from '../models/palette.js'

/**
 * Soft daylight: one hemisphere light, one sun, no shadow maps.
 * A pale sky with fog that melts the sea into the horizon.
 */
export default class Environment {
  constructor({ scene }) {
    this.sky = new THREE.Color('#e9ece9')
    scene.background = this.sky
    scene.fog = new THREE.Fog(this.sky, 140, 480)

    this.hemisphere = new THREE.HemisphereLight('#ffffff', '#d5d0c6', 1.7)
    this.sun = new THREE.DirectionalLight('#fff7ec', 1.8)
    this.sun.position.set(-0.55, 1, 0.45).multiplyScalar(100)
    scene.add(this.hemisphere, this.sun)

    this.sea = new THREE.Mesh(
      new THREE.PlaneGeometry(3000, 3000).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: palette.water, roughness: 1 })
    )
    this.sea.position.y = -1.4
    this.sea.matrixAutoUpdate = false
    this.sea.updateMatrix()
    scene.add(this.sea)
  }
}
