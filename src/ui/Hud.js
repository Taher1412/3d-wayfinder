const ICONS = {
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="wave" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/></svg>',
  reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 4v4.5h4.5"/></svg>'
}

const button = (className, label, html) => {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = `hud__button ${className}`
  b.setAttribute('aria-label', label)
  b.title = label
  b.innerHTML = html
  return b
}

/**
 * Screen furniture: wordmark, sound and reset buttons, a keyboard hint that
 * fades once you're driving, and a compass chip towards the nearest unvisited landmark.
 */
export default class Hud extends EventTarget {
  constructor(root, { touch }) {
    super()
    this.root = document.createElement('div')
    this.root.className = 'hud'

    const brand = document.createElement('div')
    brand.className = 'hud__brand'
    brand.innerHTML = '<span class="hud__flag" aria-hidden="true"><i></i><i></i><i></i></span>Bienvenue en France'

    this.compass = document.createElement('div')
    this.compass.className = 'hud__compass'
    this.compass.hidden = true
    this.compass.innerHTML = '<svg class="hud__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l6 15-6-3.5L6 18z"/></svg><span class="hud__target"></span><span class="hud__distance"></span>'
    this.arrow = this.compass.querySelector('.hud__arrow')
    this.target = this.compass.querySelector('.hud__target')
    this.distance = this.compass.querySelector('.hud__distance')

    const actions = document.createElement('div')
    actions.className = 'hud__actions'
    this.soundButton = button('hud__sound', 'Sound (M)', ICONS.sound)
    this.soundButton.addEventListener('click', () => this.dispatchEvent(new Event('mute')))
    const resetButton = button('hud__reset', 'Back to last landmark (R)', ICONS.reset)
    resetButton.addEventListener('click', () => this.dispatchEvent(new Event('reset')))
    actions.append(resetButton, this.soundButton)

    this.hint = document.createElement('div')
    this.hint.className = 'hud__hint'
    this.hint.innerHTML = `
      <span><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> drive</span>
      <span><kbd>Space</kbd> handbrake</span>
      <span><kbd>R</kbd> back to last landmark</span>
      <span><kbd>M</kbd> sound</span>`

    this.root.append(brand, this.compass, actions, this.hint)
    root.append(this.root)
    this.setTouch(touch)
    this.drivenTime = 0
  }

  setTouch(touch) {
    this.root.classList.toggle('is-touch', touch)
  }

  setMuted(muted) {
    this.soundButton.innerHTML = muted ? ICONS.muted : ICONS.sound
    this.soundButton.setAttribute('aria-pressed', String(muted))
  }

  /** Called every frame. `driving` = any throttle/steer input. */
  update(dt, { driving, pointer }) {
    if (driving) this.drivenTime += dt
    if (this.drivenTime > 3 && !this.hint.classList.contains('is-hidden')) this.hint.classList.add('is-hidden')

    if (!pointer) {
      this.compass.hidden = true
      return
    }
    this.compass.hidden = false
    if (this.target.textContent !== pointer.name) this.target.textContent = pointer.name
    const km = Math.round(pointer.distance / 10) * 10
    this.distance.textContent = km < 10 ? 'right here' : `${km} km`
    this.arrow.style.transform = `rotate(${pointer.angle}rad)`
  }
}
