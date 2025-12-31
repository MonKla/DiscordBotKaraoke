import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'silence-chrome-devtools-probe',
      configureServer(server) {
        server.middlewares.use('/.well-known/appspecific/com.chrome.devtools.json', (req, res, next) => {
          res.statusCode = 200;
          res.end();
        });
      }
    }
  ],
  server: {
    port: 5173,
    headers: {
      'Content-Security-Policy': "default-src 'self'; connect-src 'self' http://localhost:3001 ws://localhost:3001 https://discord.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com; frame-src 'self' https://www.youtube.com; img-src 'self' data: https://i.ytimg.com https://cdn.discordapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
