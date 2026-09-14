import ModelBuilder from './ModelBuilder.js'
import { palette } from './palette.js'

/**
 * Model factory. Every file in ./landmarks/ default-exports one function
 * `(builder, { palette, params, landmark }) => void`; its file name is the key
 * used by `model:` in data/landmarks.js. Adding a model = adding a file.
 */
const modules = import.meta.glob('./landmarks/*.js', { eager: true, import: 'default' })

export const models = Object.fromEntries(
  Object.entries(modules).map(([path, fn]) => [path.match(/([^/]+)\.js$/)[1], fn])
)

const cache = new Map()

export function buildModel(landmark) {
  const key = JSON.stringify([landmark.model, landmark.kind, landmark.scale ?? 1, landmark.params ?? null])
  if (!cache.has(key)) {
    let fn = models[landmark.model]
    if (!fn) {
      console.warn(`No model "${landmark.model}" for landmark "${landmark.id}", using placeholder`)
      fn = models.placeholder
    }
    const builder = new ModelBuilder()
    fn(builder, { palette, params: landmark.params ?? {}, landmark })
    cache.set(key, builder.build(landmark.scale ?? 1))
  }
  return cache.get(key)
}
