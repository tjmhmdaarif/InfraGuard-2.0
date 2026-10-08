import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/InfraGuard-2.0/' : '/',
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
        manualChunks: (id) => {
          if (id.includes('node_modules/react')) return 'vendor-react';
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) return 'vendor-three';
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion';
          if (id.includes('node_modules/zustand')) return 'vendor-data';
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
        },
      },
    },
    // Increase chunk size warning threshold slightly for 3D apps
    chunkSizeWarningLimit: 1000,
  },
})
