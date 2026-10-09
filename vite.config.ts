import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Phase 0: runner is configured; geometry suites start in Phase 1.
    passWithNoTests: true,
  },
})
