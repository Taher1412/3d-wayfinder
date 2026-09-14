# Bienvenue en France

A small car on a low-poly map of France. Drive up to a landmark and a panel opens. Monuments get a short cultural note and a fun fact. Admin buildings (Préfecture, CROUS & bank) get the step-by-step checklist a newly arrived international student actually has to work through.

Three.js (WebGL), Rapier physics, Vite, vanilla JS. Howler for sound, lil-gui for the debug panel. Every model is built from primitives in code: no downloaded assets.

## Run it

Needs Node 20+.

```sh
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build in `dist/` (static, deployable anywhere) |
| `npm run preview` | Serve the production build |
| `npm run validate` | Check the map data (landmarks, regions, props) |
| `npm run car:metrics` | Drive the car headlessly and print handling numbers |

Add `#debug` to the URL for the debug panel: fps and draw calls, live car tuning, camera and light settings, collider wireframes, a free camera and teleport-to-landmark.

### Controls

| Keyboard | Touch |
| --- | --- |
| Arrows or WASD (ZQSD on AZERTY): drive | Joystick (left): steer |
| Down while moving: brake, then reverse | Blue pedal: accelerate; round pedal: brake / reverse |
| Space: handbrake | |
| R: back to the last landmark | ↺ button |
| M: sound on/off | Speaker button |
| Esc: close the panel | × on the panel |

Touch controls appear automatically on coarse pointers.

## Add a landmark

A landmark is **one entry in `src/data/landmarks.js`** plus **one model file in `src/models/landmarks/`**. Nothing else needs to change: the world, colliders, trigger zone, name plate, panel and compass all come from the entry.

### 1. The data entry

```js
// src/data/landmarks.js
{
  id: 'arc-de-triomphe',            // unique, kebab-case
  name: 'Arc de Triomphe',          // shown on the name plate
  kind: 'monument',                 // 'monument' → culture panel, 'admin' → checklist
  region: 'nord',                   // an id from src/data/regions.js
  position: toWorld(2.295, 48.8738),// real longitude, latitude → map position
  facing: 180,                      // compass degrees the model's front looks towards
  model: 'arcDeTriomphe',           // file name in src/models/landmarks/
  params: {},                       // optional, passed to the model function
  scale: 1,
  trigger: { radius: 10 },          // the zone that opens the panel
  panel: {
    title: 'Arc de Triomphe',
    eyebrow: 'Paris',               // optional, shown before the region name
    body: ['Two or three sentences.', 'No encyclopaedia.'],
    fact: 'One fun fact.',
    steps: null,                    // admin: ['Short imperative step.', ...] and body: null
    link: { label: 'paris-arc-de-triomphe.fr', href: 'https://www.paris-arc-de-triomphe.fr' }
  }
}
```

`toWorld(lon, lat)` projects real coordinates onto the map, so monuments land roughly where they are in France. You can also write `[x, 0, z]` directly (north is −z, east is +x).

### 2. The model

Each file default-exports one function. Its file name is the `model` key; the factory picks it up automatically.

```js
// src/models/landmarks/arcDeTriomphe.js
export default function arcDeTriomphe(b, { params, landmark }) {
  // Everything is in model space, front facing +Z, ground at y = 0
  b.box(3, 8, 2.2, { at: [-3, 4, 0], color: 'stone' })     // left pillar (solid by default)
  b.box(3, 8, 2.2, { at: [3, 4, 0], color: 'stone' })      // right pillar
  b.box(9, 2.5, 2.4, { at: [0, 9.25, 0], color: 'linen' }) // attic
  b.arc(1.5, 0.3, Math.PI, { at: [0, 6, 1.15], color: 'stone', solid: false })
}
```

The builder (`src/models/ModelBuilder.js`) has `box`, `cylinder`, `cone`, `sphere`, `lathe`, `extrude` (with holes), `frustum`, `strut` (a beam between two points), `arc`, and `solidBox` (an invisible collider). Every primitive takes `at`, `rot`, `scale`, `color` (a name from `src/models/palette.js`) and `solid`.

- Parts are merged into one mesh, so each landmark is one draw call.
- Solid parts become colliders: boxes as cuboids, everything else as a convex hull.
- Put `solid: false` on decoration and on anything the car should fit through, like arches or the gap under the Eiffel Tower. Use `solidBox` for piers instead.
- Keep a model to about 60 lines. Low-poly and charming beats accurate.

Until the model file exists, the landmark falls back to the placeholder column, so the data can go in first.

### 3. Check it

```sh
npm run validate
```

The validator checks:
- unique ids and required fields;
- a known kind, region and model file;
- the position and trigger zone sit inside the map and clear of the coast;
- zones don't overlap and the spawn isn't inside one;
- the panel matches its kind: body and fact for monuments, steps for admin buildings;
- no typos in field names.

It exits non-zero on problems, so it can gate a build.

## The rest of the map data

- **`src/data/regions.js`**: the hexagon outline, the colour zones (their polygons must tile the outline), the trees each zone gets (`decor: { trees, kinds }`), and the spawn point.
- **`src/data/props.js`**: groups of cones, boxes and hay bales the car can knock over, laid out as a `line`, `pyramid` or `scatter`.

## Project layout

```
src/
  data/        landmarks, regions, props, lon/lat projection (plain data, no three.js)
  models/      ModelBuilder, palette + shared material, car, landmarks/*.js
  world/       World (builds everything from data), Landmark, Ground, Decor, Props, Car, Environment
  physics/     Rapier world with fixed timestep, raycast Vehicle, carTuning.js
  controls/    keyboard + touch
  ui/          Panel, HUD, loader
  audio/       Howler, sounds synthesized at startup
  debug/       lil-gui panel (only loaded with #debug)
  Experience.js  renderer, camera, loop, and the glue between world events and the UI
scripts/       validate-landmarks.js, car-metrics.js
```

## Tuning the car

All handling lives in `src/physics/carTuning.js`. Change values live in `#debug` (there's a copy-as-JSON button), then check the numbers headlessly:

```sh
npm run car:metrics                       # current tuning
node scripts/car-metrics.js turnRate=2.2  # try an override
```

It reports:
- suspension settle after a drop;
- 0–90% acceleration time and braking distance;
- coast-down;
- turning radius and tilt at three speeds;
- slalom stability, handbrake turns, a full-speed wall hit and a ramp jump.

## Notes

- **Materials.** Everything uses plain `MeshStandardMaterial` with flat shading and vertex colours. TSL node materials only run on `WebGPURenderer`, not `WebGLRenderer`. For a later WebGPU move, `flatMaterial` in `src/models/palette.js` is the one shared material to swap.
- **Lighting.** One hemisphere light and one directional light. No shadow maps: a blurred-circle texture draws contact shadows under the car, landmarks, trees and props.
- **Performance** (production build, measured):
  - **JS size**: 188 KB gzipped excluding Rapier, including the debug chunk that only loads on demand. Rapier's compat build, with its wasm inlined, is a separate 1.05 MB gzipped chunk.
  - **Load**: the loader is plain HTML, so first paint doesn't wait for any JS. On localhost it paints in about 0.1 s. Under throttled Fast 3G it paints in 0.4 s and is drivable in about 7.6 s, most of that the Rapier download.
  - **Scene**: about 24 draw calls and 14k triangles.
  - **Adapting**: pixel ratio steps down if frames stay under 45 fps; phones get no MSAA and a lower ratio cap.
  - `performance.mark('bienvenue:ready')` marks the first drivable frame.
- **Credit.** The interaction model (drive a physics car around an open world, no menus) is inspired by [Bruno Simon's folio-2019](https://github.com/brunosimon/folio-2019) (MIT). Its source was read for architecture and physics-tuning ideas. The art, models, sounds and text here are original.
- **Admin steps** reflect procedures and sites as of 2026 (ANEF, CVEC, Ameli, CAF). They change, so check the official links before relying on them.
