import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import tailwind from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl(),tailwind(),],
  
   server: {
    // This enables HTTPS.
    host:true,
    https: true,
    proxy: {
      // This is the configuration for the CORS proxy.
      // Any request from your React app starting with '/api'
      // will be forwarded to the target server.
      '/api': {
        target: 'https://xpresshotelpos.com/booking/api',
        // 'changeOrigin' is necessary for the target server to accept the request.
        changeOrigin: true,
        // This rewrites the request path. '/api/get_hotel_details.php'
        // becomes '/get_hotel_details.php' before being sent to the target.
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})