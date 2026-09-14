import * as THREE from 'three'

/**
 * The shared colour palette. Model functions refer to colours by name,
 * so the whole map can be re-tinted from here.
 */
export const palette = {
  // Paper, stone and ground
  white: '#faf8f3',
  paper: '#f3efe7',
  linen: '#e7e0d3',
  stone: '#d6cdbd',
  sand: '#e2d4b6',
  sandstone: '#d9bd8f',
  sandstoneDeep: '#bf9d6c',
  granite: '#a39f98',
  graniteDeep: '#7f7b75',
  slate: '#56606e',
  ink: '#2f3440',

  // Flag-adjacent accents, muted
  blue: '#4a6fa5',
  blueSoft: '#9fb4d0',
  blueDeep: '#2f4b78',
  red: '#c4574f',
  redSoft: '#e3aaa3',
  redDeep: '#94403b',

  // Nature
  leaf: '#94b183',
  leafDeep: '#6e8f62',
  cypress: '#4f6b4a',
  olive: '#a2ab8a',
  lavender: '#9d8dc6',
  lavenderDeep: '#7a6aa8',
  bark: '#8a6e55',
  water: '#a9bdcc',

  // Porcelain
  porcelain: '#fbfaf6',
  porcelainBlue: '#35589a',

  glass: '#bdcad6',

  // Metal
  bronze: '#7d6552',
  gold: '#c9a45c'
}

/**
 * One flat-shaded material for every merged model: colours come from vertex
 * colours, so all landmarks share a single program. This is the one place to
 * swap for a TSL node material when moving to WebGPURenderer.
 */
export const flatMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 0.92,
  metalness: 0
})
