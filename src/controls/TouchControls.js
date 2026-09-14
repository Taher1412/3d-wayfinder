const RADIUS = 52 // px of joystick travel

/**
 * On-screen joystick (steering) and pedals (gas, reverse/brake) for coarse pointers.
 * Writes into `controls.touch`, which Controls merges with the keyboard.
 */
export default class TouchControls {
  constructor(root, controls) {
    this.controls = controls
    this.state = { throttle: 0, steer: 0 }
    this.gas = false
    this.reverse = false

    this.root = document.createElement('div')
    this.root.className = 'touch'
    this.root.innerHTML = `
      <div class="touch__stick-zone" aria-label="Steering">
        <div class="touch__stick"><div class="touch__knob"></div></div>
      </div>
      <div class="touch__pedals">
        <button type="button" class="touch__pedal touch__pedal--reverse" aria-label="Brake / reverse">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <button type="button" class="touch__pedal touch__pedal--gas" aria-label="Accelerate">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/><path d="M6 20l6-6 6 6" opacity="0.45"/></svg>
        </button>
      </div>`
    root.append(this.root)

    this.zone = this.root.querySelector('.touch__stick-zone')
    this.stick = this.root.querySelector('.touch__stick')
    this.knob = this.root.querySelector('.touch__knob')
    this.setStick()
    this.setPedal(this.root.querySelector('.touch__pedal--gas'), (down) => (this.gas = down))
    this.setPedal(this.root.querySelector('.touch__pedal--reverse'), (down) => (this.reverse = down))
    this.root.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  setStick() {
    let pointerId = null
    let originX = 0
    let originY = 0
    const move = (event) => {
      const dx = Math.max(-RADIUS, Math.min(RADIUS, event.clientX - originX))
      const dy = Math.max(-RADIUS * 0.4, Math.min(RADIUS * 0.4, event.clientY - originY))
      this.knob.style.transform = `translate(${dx}px, ${dy}px)`
      // Small dead zone, then a gentle curve so small thumb movements steer softly
      const x = dx / RADIUS
      const shaped = Math.abs(x) < 0.08 ? 0 : Math.sign(x) * ((Math.abs(x) - 0.08) / 0.92) ** 1.3
      this.state.steer = -shaped
      this.push()
    }
    const end = (event) => {
      if (event.pointerId !== pointerId) return
      pointerId = null
      this.state.steer = 0
      this.knob.style.transform = ''
      this.stick.classList.remove('is-active')
      this.stick.style.left = this.stick.style.top = ''
      this.push()
    }
    this.zone.addEventListener('pointerdown', (event) => {
      if (pointerId !== null) return
      pointerId = event.pointerId
      this.zone.setPointerCapture(pointerId)
      // The stick recentres under the thumb, wherever it lands in the zone
      const rect = this.zone.getBoundingClientRect()
      originX = event.clientX
      originY = event.clientY
      this.stick.style.left = `${originX - rect.left}px`
      this.stick.style.top = `${originY - rect.top}px`
      this.stick.classList.add('is-active')
      move(event)
    })
    this.zone.addEventListener('pointermove', (event) => event.pointerId === pointerId && move(event))
    this.zone.addEventListener('pointerup', end)
    this.zone.addEventListener('pointercancel', end)
  }

  setPedal(element, set) {
    const down = (event) => {
      element.setPointerCapture(event.pointerId)
      element.classList.add('is-pressed')
      set(true)
      this.push()
    }
    const up = () => {
      element.classList.remove('is-pressed')
      set(false)
      this.push()
    }
    element.addEventListener('pointerdown', down)
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', up)
    element.addEventListener('lostpointercapture', up)
  }

  push() {
    this.state.throttle = this.reverse ? -1 : this.gas ? 1 : 0
    this.controls.touch = this.state
    this.controls.emit('input')
  }

  setVisible(visible) {
    this.root.hidden = !visible
  }
}
