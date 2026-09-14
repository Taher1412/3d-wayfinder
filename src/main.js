import './style.css'
import Loader from './ui/Loader.js'

const loader = new Loader()

try {
  loader.progress(0.2, 'Loading the physics engine…')
  // Rapier (with its inlined wasm) and the 3D app download in parallel, as separate chunks
  const [{ default: RAPIER }, { default: Experience }] = await Promise.all([
    import('@dimforge/rapier3d-compat'),
    import('./Experience.js')
  ])
  loader.progress(0.6, 'Starting the physics engine…')
  await RAPIER.init()

  loader.progress(0.8, 'Building the map…')
  await new Promise(requestAnimationFrame) // let the status paint before the synchronous build
  const experience = new Experience({ container: document.querySelector('#app'), RAPIER })
  window.experience = experience

  experience.renderer.domElement.addEventListener('webglcontextlost', () => loader.fail('The 3D context was lost. Reload the page to drive again.'))
  await experience.firstFrame
  loader.done()
} catch (error) {
  console.error(error)
  const webgl = (() => {
    try {
      return !!document.createElement('canvas').getContext('webgl2')
    } catch {
      return false
    }
  })()
  loader.fail(webgl ? 'Something went wrong while loading. Try reloading the page.' : 'Your browser can’t run WebGL 2, which this map needs.')
}
