import { toMap, toWorld, between } from './geo.js'

/**
 * The map: France as l'Hexagone, split into a few zones by floor colour.
 * Polygons are [x, z] map points and must tile the outline without overlapping
 * (npm run validate checks this).
 */

// The six corners of the hexagon
const N = toMap(2.55, 51.08) // Dunkerque
const NE = toMap(8.23, 48.97) // Lauterbourg
const SE = toMap(7.53, 43.78) // Menton
const S = toMap(3.17, 42.44) // Cerbère
const SW = toMap(-1.78, 43.37) // Hendaye
const W = toMap(-4.79, 48.41) // Pointe de Corsen

export const outline = [N, NE, SE, S, SW, W]

// Where zones meet the coast / borders, and inside the country
const ardennes = between(N, NE, 0.5)
const jura = between(NE, SE, 0.6)
const vendee = between(SW, W, 0.55)
const cotentin = between(W, N, 0.45)
const tours = toMap(1.3, 47.7)
const dijon = toMap(4.6, 47.3)
const lyon = toMap(4.2, 45.6)
const cantal = toMap(2.6, 44.9)

export const regions = [
  {
    id: 'nord',
    name: 'Île-de-France & Nord',
    color: '#e9ecee',
    polygon: [N, ardennes, dijon, tours, cotentin],
    decor: { trees: 26 }
  },
  {
    id: 'est',
    name: 'Grand Est & Alpes',
    color: '#eceae5',
    polygon: [ardennes, NE, jura, lyon, dijon],
    decor: { trees: 34 }
  },
  {
    id: 'ouest',
    name: 'Normandie & Bretagne',
    color: '#e4e9e2',
    polygon: [cotentin, tours, vendee, W],
    decor: { trees: 30 }
  },
  {
    id: 'centre-ouest',
    name: 'Nouvelle-Aquitaine',
    color: '#f1eee8',
    polygon: [vendee, tours, dijon, lyon, cantal, SW],
    decor: { trees: 36 }
  },
  {
    id: 'sud',
    name: 'Occitanie & Provence',
    color: '#f1e9df',
    polygon: [SW, cantal, lyon, jura, SE, S],
    decor: { trees: 22 }
  }
]

/** Where the car starts: east of Limoges, facing Paris. Heading in compass degrees (0 = north). */
export const spawn = { position: toWorld(2.3, 46.3), heading: 0 }
