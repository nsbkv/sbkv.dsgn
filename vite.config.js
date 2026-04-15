import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    cors: true,
  },
  build: {
    // Einstellungen für die Produktion
    rollupOptions: {
      output: {
        // Entfernt die Zufallszahlen aus dem Dateinamen
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
})