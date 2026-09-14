/**
 * Merges keyboard (and later touch) into one driving state plus discrete actions.
 * Keys use `event.code`, i.e. physical positions: WASD on QWERTY is ZQSD on AZERTY.
 *
 * steer: +1 = left, -1 = right (matches the vehicle's local +X = left)
 */
const BINDINGS = {
  ArrowUp: 'forward', KeyW: 'forward',
  ArrowDown: 'backward', KeyS: 'backward',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'handbrake'
}
const ACTIONS = { KeyR: 'reset', KeyM: 'mute', Escape: 'close' }

export default class Controls extends EventTarget {
  constructor() {
    super()
    this.keys = new Set()
    this.touch = null // { throttle, steer } when a touch UI is driving
    this.state = { throttle: 0, steer: 0, handbrake: false }

    window.addEventListener('keydown', (event) => {
      if (event.target.closest?.('input, textarea, [contenteditable]')) return
      const binding = BINDINGS[event.code]
      if (binding) {
        this.keys.add(binding)
        event.preventDefault()
        this.emit('input')
      } else if (ACTIONS[event.code] && !event.repeat && !event.ctrlKey && !event.metaKey) {
        this.emit(ACTIONS[event.code])
      }
    })
    window.addEventListener('keyup', (event) => {
      const binding = BINDINGS[event.code]
      if (binding) this.keys.delete(binding)
    })
    window.addEventListener('blur', () => this.keys.clear())
  }

  emit(name) {
    this.dispatchEvent(new Event(name))
  }

  update() {
    const k = this.keys
    let throttle = (k.has('forward') ? 1 : 0) - (k.has('backward') ? 1 : 0)
    let steer = (k.has('left') ? 1 : 0) - (k.has('right') ? 1 : 0)
    if (this.touch && throttle === 0 && steer === 0) {
      throttle = this.touch.throttle
      steer = this.touch.steer
    }
    this.state.throttle = throttle
    this.state.steer = steer
    this.state.handbrake = k.has('handbrake')
    return this.state
  }
}
