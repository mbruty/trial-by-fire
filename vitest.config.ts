/// <reference types="vitest" />

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    hookTimeout: 50000,
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/utils/setup.ts'
  },
})
