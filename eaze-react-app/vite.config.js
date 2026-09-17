import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
  },
  server: {
    // Don't watch packaging output: electron-builder drops ~270 MB of binaries
    // in there, and holding handles on them breaks its final directory rename.
    watch: {
      ignored: ["**/release/**", "**/node_modules/**", "**/.git/**"],
    },
  },
})
