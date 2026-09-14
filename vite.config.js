import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 3000 // Rapier's compat build inlines its wasm (~2.8 MB) in its own chunk
  }
})
