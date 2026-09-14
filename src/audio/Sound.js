import { Howl, Howler } from 'howler'

const SAMPLE_RATE = 22050
const STORAGE_KEY = 'bienvenue:muted'

/** Encode mono samples (-1..1) as a 16-bit PCM WAV blob URL. */
function wav(samples) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const text = (offset, s) => [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)))
  text(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  text(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  text(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  samples.forEach((s, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 0x7fff, true))
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
}

/** Deterministic noise so the loop is identical on every load. */
function noise(seed = 7) {
  let x = seed
  return () => ((x = (x * 16807) % 2147483647) / 2147483647) * 2 - 1
}

/**
 * Half a second of a small flat-twin engine: a firing pulse 40 times a second,
 * each one a short thump with a little rasp. Every component completes whole
 * cycles in the loop, so it repeats seamlessly; playback rate raises the pitch.
 */
function engineSamples() {
  const duration = 0.5
  const firing = 40
  const out = new Float32Array(SAMPLE_RATE * duration)
  const rand = noise()
  let smooth = 0
  for (let i = 0; i < out.length; i++) {
    const t = i / SAMPLE_RATE
    const cycle = Math.floor(t * firing)
    const since = t - cycle / firing
    const cylinder = cycle % 2 ? 0.82 : 1
    smooth += (rand() - smooth) * 0.25
    const thump = Math.exp(-since * 32) * (0.75 * Math.sin(2 * Math.PI * 88 * since) + 0.3 * Math.sin(2 * Math.PI * 176 * since + 1))
    const rasp = Math.exp(-since * 70) * smooth * 0.35
    const hum = 0.12 * Math.sin(2 * Math.PI * 80 * t)
    out[i] = (thump * cylinder + rasp + hum) * 0.7
  }
  return out
}

function toneSamples(notes, { duration = 0.5, decay = 7 } = {}) {
  const out = new Float32Array(Math.floor(SAMPLE_RATE * duration))
  for (const { frequency, at = 0, gain = 1 } of notes) {
    for (let i = Math.floor(at * SAMPLE_RATE); i < out.length; i++) {
      const t = i / SAMPLE_RATE - at
      const envelope = Math.min(1, t * 400) * Math.exp(-t * decay) * gain
      out[i] += envelope * (Math.sin(2 * Math.PI * frequency * t) + 0.25 * Math.sin(4 * Math.PI * frequency * t)) * 0.35
    }
  }
  return out
}

/**
 * Engine loop that follows the car, a click for UI and a chime for landmarks.
 * Nothing plays until the first key press or tap (browser autoplay rules).
 */
export default class Sound extends EventTarget {
  constructor() {
    super()
    this.muted = (() => {
      try {
        return localStorage.getItem(STORAGE_KEY) === 'true'
      } catch {
        return false
      }
    })()
    Howler.mute(this.muted)

    this.engine = new Howl({ src: [wav(engineSamples())], format: ['wav'], loop: true, volume: 0 })
    this.click = new Howl({ src: [wav(toneSamples([{ frequency: 1320 }], { duration: 0.08, decay: 60 }))], format: ['wav'], volume: 0.25 })
    this.chime = new Howl({
      src: [wav(toneSamples([{ frequency: 659.25 }, { frequency: 987.77, at: 0.11, gain: 0.8 }], { duration: 0.9, decay: 5 }))],
      format: ['wav'],
      volume: 0.35
    })

    this.volume = 0
    this.rate = 1
    this.engineId = null
    const start = () => {
      if (this.engineId === null) this.engineId = this.engine.play()
    }
    window.addEventListener('keydown', start, { once: true })
    window.addEventListener('pointerdown', start, { once: true })
  }

  toggleMute() {
    this.setMuted(!this.muted)
  }

  setMuted(muted) {
    this.muted = muted
    Howler.mute(muted)
    try {
      localStorage.setItem(STORAGE_KEY, String(muted))
    } catch {
      // storage blocked: the preference lasts for this visit only
    }
    if (!muted) this.play('click')
    this.dispatchEvent(new Event('change'))
  }

  play(name) {
    this[name]?.play()
  }

  /** speed01: 0..1 of top speed, throttle: -1..1 */
  update(dt, speed01, throttle) {
    if (this.engineId === null) return
    const k = 1 - Math.exp(-6 * dt)
    this.volume += (0.12 + 0.22 * speed01 + 0.06 * Math.abs(throttle) - this.volume) * k
    this.rate += (0.75 + 1.05 * speed01 + 0.12 * Math.abs(throttle) - this.rate) * k
    this.engine.volume(this.volume, this.engineId)
    this.engine.rate(this.rate, this.engineId)
  }
}
