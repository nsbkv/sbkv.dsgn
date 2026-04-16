import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    cors: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      // ❗ ВАЖНО: Указываем Vite, какой файл основной
      input: {
        main: './src/main.js' 
      },
      output: {
        entryFileNames: 'assets/main.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})