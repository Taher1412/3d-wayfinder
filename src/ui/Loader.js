/** Drives the loader that index.html paints before any JavaScript arrives. */
export default class Loader {
  constructor(element = document.querySelector('#loader')) {
    this.element = element
    this.status = element.querySelector('.loader__status')
    this.bar = element.querySelector('.loader__bar span')
  }

  progress(value, message) {
    this.bar.style.transform = `scaleX(${Math.max(0.08, Math.min(1, value))})`
    if (message) this.status.textContent = message
  }

  done() {
    this.progress(1)
    this.element.classList.add('is-done')
    this.element.addEventListener('transitionend', () => this.element.remove(), { once: true })
  }

  fail(message) {
    if (!this.element.isConnected) document.body.append(this.element)
    this.element.classList.remove('is-done')
    this.status.textContent = message
    this.bar.parentElement.hidden = true
  }
}
