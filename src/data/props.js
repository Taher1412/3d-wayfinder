import { toWorld } from './geo.js'

/**
 * Loose objects the car can knock about.
 *
 * type      'cone' | 'crate' | 'hay'
 * position  [x, 0, z] of the group
 * layout    'line'    count objects `spacing` apart towards `facing` (compass degrees)
 *           'pyramid' a stack, rows along `facing` + 90°
 *           'scatter' count objects within `radius`
 */
export const props = [
  // A slalom just ahead of the start, to get a feel for the steering
  { type: 'cone', position: toWorld(2.4, 46.75), layout: 'line', count: 7, spacing: 5, facing: 0 },

  // Moving-in boxes by the start
  { type: 'crate', position: toWorld(2.75, 46.45), layout: 'pyramid', count: 10, facing: 0 },

  // Boxes outside the CROUS, cones around the Eiffel Tower's forecourt
  { type: 'crate', position: toWorld(2.95, 45.3), layout: 'pyramid', count: 6, facing: 20 },
  { type: 'cone', position: toWorld(2.55, 48.58), layout: 'line', count: 5, spacing: 3, facing: 90 },

  // Hay bales in the fields of the Centre, Normandie and the Limousin
  { type: 'hay', position: toWorld(1.6, 47.3), layout: 'scatter', count: 7, radius: 7 },
  { type: 'hay', position: toWorld(-0.4, 48.3), layout: 'scatter', count: 6, radius: 6 },
  { type: 'hay', position: toWorld(0.2, 45.4), layout: 'scatter', count: 5, radius: 5 }
]
