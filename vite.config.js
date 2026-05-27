import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset paths relative so the build works on GitHub Pages
// project sites and any static host without extra configuration.
export default defineConfig({
  base: './',
  plugins: [react()],
})
