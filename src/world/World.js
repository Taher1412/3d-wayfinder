import { landmarks } from '../data/landmarks.js'
import { regions, spawn } from '../data/regions.js'
import { compassToYaw } from '../utils/compass.js'
import Landmark from './Landmark.js'
import Ground from './Ground.js'
import Environment from './Environment.js'
import Decor from './Decor.js'
import Props from './Props.js'

const EXIT_MARGIN = 1.5 // leave a zone a bit further out than you enter it, so edges don't flicker

/**
 * Builds the scene from data/ and reports when the car enters or leaves a landmark zone.
 * Events: 'enter' and 'leave', with the Landmark as `event.detail`.
 */
export default class World extends EventTarget {
  constructor({ scene, physics }) {
    super()
    this.scene = scene
    this.physics = physics
    this.environment = new Environment({ scene })
    this.ground = new Ground({ scene, physics })
    this.regions = new Map(regions.map((r) => [r.id, r]))
    this.spawn = {
      position: [spawn.position[0], 1.2, spawn.position[2]],
      heading: compassToYaw(spawn.heading ?? 0)
    }
    this.landmarks = landmarks.map((data) => new Landmark({ data, scene, physics }))
    this.decor = new Decor({ scene, physics })
    this.props = new Props({ scene, physics })
    this.current = null
  }

  update(dt, carPosition, camera) {
    const { x, z } = carPosition
    this.props.update()
    let inside = null
    let best = Infinity
    for (const landmark of this.landmarks) {
      landmark.update(dt, camera)
      const d = landmark.distanceSquared(x, z)
      const radius = landmark.radius + (landmark === this.current ? EXIT_MARGIN : 0)
      if (d < radius * radius && d < best) {
        inside = landmark
        best = d
      }
    }
    if (inside !== this.current) {
      const previous = this.current
      this.current = inside
      if (previous) this.dispatchEvent(new CustomEvent('leave', { detail: previous }))
      if (inside) this.dispatchEvent(new CustomEvent('enter', { detail: inside }))
    }
  }
}
