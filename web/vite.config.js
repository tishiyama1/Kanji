import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base '/' works behind CloudFront at the domain root.
export default defineConfig({
  plugins: [react()],
  base: '/',
})
