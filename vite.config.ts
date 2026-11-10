import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  base: '/lom-ai-chat/',
  resolve: {
    alias: {
      '@app': path.resolve(import.meta.dirname, './src/app'),
      '@pages': path.resolve(import.meta.dirname, './src/pages'),
      '@widgets': path.resolve(import.meta.dirname, './src/widgets'),
      '@features': path.resolve(import.meta.dirname, './src/features'),
      '@entities': path.resolve(import.meta.dirname, './src/entities'),
      '@shared': path.resolve(import.meta.dirname, './src/shared'),
    },
  },
})
