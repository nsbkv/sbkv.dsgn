import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    cors: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Теперь мы жестко задаем имя main.js
        entryFileNames: 'assets/main.js', 
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})