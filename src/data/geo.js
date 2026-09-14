/**
 * Real coordinates → map coordinates.
 *
 * A plain equirectangular projection centred on France: 1° of latitude = SCALE
 * world units, longitude shrunk by cos(latitude). North is -Z, east is +X.
 * Good enough for a stylized map, and it means monuments can be placed from
 * their real longitude/latitude.
 */
export const ORIGIN = { lon: 2.5, lat: 46.6 }
export const SCALE = 32

const COS_LAT = Math.cos((ORIGIN.lat * Math.PI) / 180)
const round = (v) => Math.round(v * 10) / 10

/** [x, z] on the map for a longitude/latitude in degrees. */
export function toMap(lon, lat) {
  return [round((lon - ORIGIN.lon) * COS_LAT * SCALE), round(-(lat - ORIGIN.lat) * SCALE)]
}

/** [x, 0, z] world position for a longitude/latitude in degrees. */
export function toWorld(lon, lat) {
  const [x, z] = toMap(lon, lat)
  return [x, 0, z]
}

/** Point a fraction `t` of the way from map point a to b. */
export function between(a, b, t) {
  return [round(a[0] + (b[0] - a[0]) * t), round(a[1] + (b[1] - a[1]) * t)]
}

/** Roughly how many real kilometres one world unit stands for. */
export const KM_PER_UNIT = 111.32 / SCALE
