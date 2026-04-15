import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    cors: true, // Это разрешает всем сайтам обращаться к твоему локальному серверу
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },
})