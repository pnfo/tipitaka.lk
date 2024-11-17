import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // base: '/new-static/', //in prod make sure nginx passes these requests to the new server
  server: {
    proxy: {
      '/sql-query': "http://192.168.1.20:8401",
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',   // App 1 entry point
        align: 'dev/align/index.html'     // App 2 entry point
      }
    }
  },
})
