import './style.css'

// Rapier (with its inlined wasm) and the 3D app load in parallel, as separate chunks
const [{ default: RAPIER }, { default: Experience }] = await Promise.all([
  import('@dimforge/rapier3d-compat'),
  import('./Experience.js')
])
await RAPIER.init()

window.experience = new Experience({ container: document.querySelector('#app'), RAPIER })
