import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_APP_BASE_PATH || '/'

  return {
    plugins: [react()],
    base: basePath,
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './tests/setup.ts',
      css: true,
      exclude: ['tests/e2e/**', 'node_modules/**'],
    },
  }
})
