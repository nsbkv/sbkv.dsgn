import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    cors: true, // Erlaubt CORS während der lokalen Entwicklung
  },
  build: {
    // Legt fest, wo die Dateien nach dem Build landen
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Erzwingt saubere Dateinamen ohne Zufalls-Strings
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
})