// vite.config.js

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import tailwind from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default ({ mode }) => {
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === "development";

  const BASE_PATH = isDev ? '/' : '/booking/';

  // This proxy configuration will now ONLY be used in local development
  const proxyConfig = {
    '/initiate-payment': {
      target: 'http://localhost:5000', // Your local Node.js server
      changeOrigin: true,
      secure: false,
    },
    '/booking/api': {
      target: env.VITE_API_URL || 'https://xpresshotelpos.com',
      changeOrigin: true,
      secure: true,
      rewrite: (path) => path.replace(/^\/api/, '/booking/api'),
    },
  };

  return defineConfig({
    plugins: [react(), basicSsl(), tailwind()],
    base: BASE_PATH,
    server: {
      host: true,
      https: true,
      port: 5173,
      strictPort: false,
      // The proxy is now only applied if in development mode
      proxy: isDev ? proxyConfig : undefined,
    },
    build: {
      outDir: "dist",
      sourcemap: isDev,
    },
    define: {
      _API_BASE_: JSON.stringify(BASE_PATH),
      _BACKEND_URL_: JSON.stringify(
        env.VITE_API_URL || "https://xpresshotelpos.com/booking/api"
      ),
      _ENCODED_STRING_: JSON.stringify(env.VITE_ENCODED_STRING || "QWVYSS9QVTREQjNLYzd0bjRZRTg4dz09"),
    },
  });
};
