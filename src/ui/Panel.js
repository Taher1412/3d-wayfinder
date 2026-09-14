const STORAGE_PREFIX = 'bienvenue:steps:'

const load = (id) => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_PREFIX + id)) ?? []
  } catch {
    return []
  }
}
const save = (id, done) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(done))
  } catch {
    // private mode or storage blocked: the checklist just won't persist
  }
}

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

/**
 * Renders whatever payload a landmark carries:
 *   body + fact  → culture panel
 *   steps        → practical checklist, ticks remembered per landmark
 *   link         → optional outbound link
 * Emits 'close' when the visitor dismisses it.
 */
export default class Panel extends EventTarget {
  constructor(root) {
    super()
    this.landmark = null
    this.hideTimer = null

    this.root = el('aside', 'panel')
    this.root.hidden = true
    this.root.setAttribute('aria-live', 'polite')
    this.root.setAttribute('aria-labelledby', 'panel-title')

    this.close = this.close.bind(this)
    const closeButton = el('button', 'panel__close')
    closeButton.type = 'button'
    closeButton.setAttribute('aria-label', 'Close (Esc)')
    closeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
    closeButton.addEventListener('click', this.close)

    this.eyebrow = el('p', 'panel__eyebrow')
    this.title = el('h2', 'panel__title')
    this.title.id = 'panel-title'
    this.content = el('div', 'panel__content')
    this.root.append(closeButton, this.eyebrow, this.title, this.content)
    root.append(this.root)
  }

  show(landmark, eyebrow) {
    clearTimeout(this.hideTimer)
    this.landmark = landmark
    const { panel } = landmark
    this.root.dataset.kind = landmark.kind
    this.eyebrow.textContent = panel.eyebrow ? `${panel.eyebrow} · ${eyebrow}` : eyebrow
    this.title.textContent = panel.title ?? landmark.name
    this.content.replaceChildren(...this.render(landmark))
    this.root.scrollTop = 0
    this.root.hidden = false
    requestAnimationFrame(() => this.root.classList.add('is-open'))
  }

  render({ id, panel }) {
    const nodes = []
    for (const paragraph of panel.body ?? []) nodes.push(el('p', 'panel__text', paragraph))

    if (panel.fact) {
      const fact = el('div', 'panel__fact')
      fact.append(el('span', 'panel__label', 'Fun fact'), el('p', null, panel.fact))
      nodes.push(fact)
    }

    if (panel.steps?.length) {
      const done = load(id)
      const progress = el('p', 'panel__progress')
      const list = el('ol', 'panel__steps')
      const refresh = () => {
        const count = panel.steps.filter((_, i) => done[i]).length
        progress.textContent = `${count} / ${panel.steps.length} done`
      }
      panel.steps.forEach((step, i) => {
        const item = el('li', 'panel__step')
        const label = el('label')
        const box = el('input')
        box.type = 'checkbox'
        box.checked = Boolean(done[i])
        box.addEventListener('change', () => {
          done[i] = box.checked
          save(id, done)
          refresh()
        })
        label.append(box, el('span', 'panel__step-number', String(i + 1)), el('span', 'panel__step-text', step))
        item.append(label)
        list.append(item)
      })
      refresh()
      nodes.push(progress, list)
    }

    if (panel.link?.href) {
      const link = el('a', 'panel__link', panel.link.label ?? panel.link.href)
      link.href = panel.link.href
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      nodes.push(link)
    }
    return nodes
  }

  hide() {
    if (!this.landmark) return
    this.landmark = null
    this.root.classList.remove('is-open')
    clearTimeout(this.hideTimer)
    this.hideTimer = setTimeout(() => (this.root.hidden = true), 300)
  }

  close() {
    if (!this.landmark) return
    const landmark = this.landmark
    this.hide()
    this.dispatchEvent(new CustomEvent('close', { detail: landmark }))
  }
}
