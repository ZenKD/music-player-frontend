import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This tells Vite: "When code asks for 'jsmediatags', give it this specific file"
      "jsmediatags": "jsmediatags/dist/jsmediatags.min.js",
    },
  },
})