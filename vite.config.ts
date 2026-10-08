import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Enable code splitting for better load performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // 3D engine — heaviest chunk, only loaded on 3D routes
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei', 'postprocessing'],
          // Animation libraries
          'vendor-motion': ['framer-motion', 'gsap'],
          // Data & state
          'vendor-data': ['zustand', '@tanstack/react-query', 'recharts'],
          // Icons
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // Increase chunk size warning threshold slightly for 3D apps
    chunkSizeWarningLimit: 1000,
  },
})
