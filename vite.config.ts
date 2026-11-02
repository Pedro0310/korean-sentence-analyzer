import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174 },
  // The Kiwi worker (src/lib/kiwi.worker.ts) is an ES module.
  worker: { format: 'es' },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
