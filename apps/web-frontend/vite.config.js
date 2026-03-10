import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    // Warn when chunks exceed 500KB (helps catch regressions)
    chunkSizeWarningLimit: 500,
    // Enable CSS code splitting per async chunk
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Split heavy vendor libraries into separate cacheable chunks
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-monaco': ['@monaco-editor/react'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          'vendor-animation': ['framer-motion'],
          'vendor-ui': ['sonner', 'lucide-react'],
        },
      },
    },
  },
})