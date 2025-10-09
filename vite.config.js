import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import tailwind from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default ({ mode }) => {
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd(), '');

  const ENCODED_STRING = env.VITE_ENCODED_STRING || "QWVYSS9QVTREQjNLYzd0bjRZRTg4dz09";
  const BASE_PATH = `/pre/op2/${ENCODED_STRING}`;
  const isDev = mode === "development";

  return defineConfig({
    plugins: [react(), basicSsl(), tailwind()],
    base: BASE_PATH + "/",
    server: {
      host: true,
      https: true,
      port: 5173,
      open: `https://localhost:5173${BASE_PATH}/`,
      strictPort: false,
      proxy: {
        // This proxy rule intercepts any request starting with "/api"
        '/api': {
          // The target is the base domain of the external API
          target: env.VITE_API_URL || 'https://xpresshotelpos.com',
          changeOrigin: true, // Necessary for the target server to accept the request
          secure: true,      // Verifies the SSL Certificate
          // This rewrite rule is crucial. It transforms the path.
          // Example: '/api/get_hotel_details.php' becomes '/booking/api/get_hotel_details.php'
          rewrite: (path) => path.replace(/^\/api/, '/booking/api'),
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: isDev,
    },
    define: {
      _BACKEND_URL_: JSON.stringify(env.VITE_API_URL || "https://xpresshotelpos.com/booking/api"),
      _ENCODED_STRING_: JSON.stringify(ENCODED_STRING),
      _API_BASE_: JSON.stringify(BASE_PATH),
    },
  });
}

