/**
 * Data uses compass degrees (0 = north, 90 = east). The world has north at -Z
 * and east at +X; a yaw of 0 looks down +Z (south).
 */
const DEG = Math.PI / 180

/** Yaw (rotation around +Y) that turns a +Z-facing object towards a compass bearing. */
export const compassToYaw = (degrees) => Math.PI - degrees * DEG

/** Unit [x, z] direction of a compass bearing. */
export const compassDirection = (degrees) => [Math.sin(degrees * DEG), -Math.cos(degrees * DEG)]
