import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward /api calls to the .NET backend during development
      '/api': {
        target: 'https://localhost:7000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
