import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // base defaults to '/' which is correct for Netlify (served from a real web server)
  // The _redirects file in /public handles SPA routing
})

