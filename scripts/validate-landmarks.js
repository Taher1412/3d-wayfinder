/**
 * Validates src/data/landmarks.js (and the map it sits on).  npm run validate
 * Exits with code 1 if anything is wrong, so it can gate a build or CI.
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { landmarks } from '../src/data/landmarks.js'
import { outline, regions, spawn } from '../src/data/regions.js'

const modelsDir = fileURLToPath(new URL('../src/models/landmarks/', import.meta.url))
const errors = []
const warnings = []
const fail = (where, message) => errors.push(`${where}: ${message}`)
const warn = (where, message) => warnings.push(`${where}: ${message}`)

const KNOWN = ['id', 'name', 'kind', 'region', 'position', 'facing', 'model', 'params', 'scale', 'trigger', 'panel']
const KNOWN_PANEL = ['title', 'eyebrow', 'body', 'fact', 'steps', 'link']
const isText = (v) => typeof v === 'string' && v.trim().length > 0
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v)

// Geometry helpers on [x, z] points
const area = (poly) => Math.abs(poly.reduce((s, [x1, z1], i) => {
  const [x2, z2] = poly[(i + 1) % poly.length]
  return s + x1 * z2 - x2 * z1
}, 0)) / 2
const inside = ([x, z], poly) => {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit
  }
  return hit
}
const edgeDistance = ([x, z], poly) => Math.min(...poly.map(([ax, az], i) => {
  const [bx, bz] = poly[(i + 1) % poly.length]
  const dx = bx - ax, dz = bz - az
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(x - (ax + t * dx), z - (az + t * dz))
}))

// Regions ---------------------------------------------------------------------
const regionIds = new Set()
let regionArea = 0
for (const [i, r] of regions.entries()) {
  const where = `regions[${i}] ${r.id ?? ''}`
  if (!isText(r.id)) fail(where, 'missing id')
  else if (regionIds.has(r.id)) fail(where, `duplicate id "${r.id}"`)
  regionIds.add(r.id)
  if (!/^#[0-9a-f]{6}$/i.test(r.color ?? '')) fail(where, 'color must be a #rrggbb hex')
  if (!Array.isArray(r.polygon) || r.polygon.length < 3) {
    fail(where, 'polygon needs at least 3 [x, z] points')
    continue
  }
  for (const p of r.polygon) {
    if (!inside(p, outline) && edgeDistance(p, outline) > 0.5) fail(where, `point [${p}] is outside the map outline`)
  }
  regionArea += area(r.polygon)
}
const outlineArea = area(outline)
if (Math.abs(regionArea - outlineArea) / outlineArea > 0.01) {
  fail('regions', `zones cover ${((regionArea / outlineArea) * 100).toFixed(1)}% of the map; they should tile it exactly (overlap or gap)`)
}

// Landmarks -------------------------------------------------------------------
if (!Array.isArray(landmarks) || landmarks.length === 0) fail('landmarks', 'must be a non-empty array')

const ids = new Set()
for (const [i, l] of landmarks.entries()) {
  const where = `landmarks[${i}] ${l.id ?? ''}`.trim()

  for (const key of Object.keys(l)) if (!KNOWN.includes(key)) warn(where, `unknown field "${key}" (typo?)`)

  if (!isText(l.id)) fail(where, 'missing id')
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(l.id)) fail(where, `id "${l.id}" should be kebab-case`)
  else if (ids.has(l.id)) fail(where, `duplicate id "${l.id}"`)
  ids.add(l.id)

  if (!isText(l.name)) fail(where, 'missing name')
  if (!['monument', 'admin'].includes(l.kind)) fail(where, `kind must be "monument" or "admin", got ${JSON.stringify(l.kind)}`)
  if (!regionIds.has(l.region)) fail(where, `region "${l.region}" is not in regions.js`)

  if (!isText(l.model)) fail(where, 'missing model')
  else if (!existsSync(`${modelsDir}${l.model}.js`)) fail(where, `no model file src/models/landmarks/${l.model}.js`)

  if (l.scale !== undefined && !(isNumber(l.scale) && l.scale > 0)) fail(where, 'scale must be a positive number')
  if (l.facing !== undefined && !isNumber(l.facing)) fail(where, 'facing must be compass degrees')
  const radius = l.trigger?.radius
  if (!(isNumber(radius) && radius > 0)) fail(where, 'trigger.radius must be a positive number')

  const pos = l.position
  if (!Array.isArray(pos) || pos.length !== 3 || !pos.every(isNumber)) {
    fail(where, 'position must be [x, y, z] numbers')
  } else {
    const p = [pos[0], pos[2]]
    if (!inside(p, outline)) fail(where, `position [${pos}] is outside the map`)
    else if (isNumber(radius) && edgeDistance(p, outline) < radius + 2) fail(where, 'trigger zone crosses the coast')
    const region = regions.find((r) => r.id === l.region)
    if (region && inside(p, outline) && !inside(p, region.polygon)) warn(where, `position is not inside region "${l.region}"`)
  }

  // Panel
  const panel = l.panel
  if (!panel || typeof panel !== 'object') {
    fail(where, 'missing panel')
    continue
  }
  for (const key of Object.keys(panel)) if (!KNOWN_PANEL.includes(key)) warn(where, `unknown panel field "${key}" (typo?)`)
  if (!isText(panel.title)) fail(where, 'panel.title is required')
  if (l.kind === 'monument') {
    if (!Array.isArray(panel.body) || !panel.body.length || !panel.body.every(isText)) fail(where, 'monument panels need body: [paragraph, ...]')
    if (!isText(panel.fact)) fail(where, 'monument panels need a fun fact')
    if (panel.steps) fail(where, 'monument panels use body, not steps')
    const sentences = (panel.body ?? []).join(' ').split(/[.!?](\s|$)/).filter((s) => s?.trim()).length
    if (sentences > 3) warn(where, `body has ~${sentences} sentences; keep it to 2-3`)
  }
  if (l.kind === 'admin') {
    if (!Array.isArray(panel.steps) || !panel.steps.length || !panel.steps.every(isText)) fail(where, 'admin panels need steps: [step, ...]')
    if (panel.body) fail(where, 'admin panels use steps, not body')
  }
  if (panel.link != null && !(isText(panel.link.label) && /^https:\/\//.test(panel.link.href ?? ''))) {
    fail(where, 'link must be null or { label, href: "https://..." }')
  }
}

// Zones must not overlap, and the spawn must be outside all of them
const valid = landmarks.filter((l) => Array.isArray(l.position) && isNumber(l.trigger?.radius))
for (let a = 0; a < valid.length; a++) {
  for (let b = a + 1; b < valid.length; b++) {
    const A = valid[a], B = valid[b]
    const d = Math.hypot(A.position[0] - B.position[0], A.position[2] - B.position[2])
    if (d < A.trigger.radius + B.trigger.radius + 4) fail(`${A.id} / ${B.id}`, `trigger zones are too close (${d.toFixed(1)} apart)`)
  }
}
const s = [spawn.position[0], spawn.position[2]]
if (!inside(s, outline)) fail('spawn', 'is outside the map')
for (const l of valid) {
  if (Math.hypot(s[0] - l.position[0], s[1] - l.position[2]) < l.trigger.radius + 3) fail('spawn', `starts inside the "${l.id}" zone`)
}

// Report ----------------------------------------------------------------------
for (const w of warnings) console.warn(`⚠ ${w}`)
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`)
  console.error(`\n${errors.length} problem${errors.length > 1 ? 's' : ''} in the map data.`)
  process.exit(1)
}
console.log(`✓ ${landmarks.length} landmarks, ${regions.length} regions: all good.`)
