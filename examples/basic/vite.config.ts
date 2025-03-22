import { defineConfig } from 'vite'
import shimmySpa from 'vite-plugin-shimmy-spa'

export default defineConfig({
  plugins: [shimmySpa()],
  server: {
    port: 3000
  }
}) 