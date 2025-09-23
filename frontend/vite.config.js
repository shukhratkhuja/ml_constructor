import { defineConfig } from 'vite'

export default defineConfig({
  root: './frontend',  // index.html shu yerdaligini ko‘rsatish
  build: {
    outDir: '../dist', // build chiqadigan joy
  },
})
