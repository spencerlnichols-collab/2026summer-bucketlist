import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT) || 5173,
  },
  optimizeDeps: {
    exclude: ['tesseract.js'],
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
})
