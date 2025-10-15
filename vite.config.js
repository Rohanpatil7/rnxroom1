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

    // --- MODIFIED SECTION ---
    // This logic now sets the correct base path for development vs. production.
    // For development (`npm run dev`), it's the root '/'.
    // For production (`npm run build`), it's '/booking/'.
    const BASE_PATH = isDev ? '/' : '/booking/';
    // --- END OF MODIFIED SECTION ---

    return defineConfig({
      plugins: [react(), basicSsl(), tailwind()],

      // Use the dynamically set base path
      base: BASE_PATH,

      server: {
        host: true,
        https: true,
        port: 5173,
        // Opens the correct, simplified URL for local development
        // open: `https://localhost:5173/`,
        strictPort: false,
        proxy: {

          '/initiate-payment': {
          target: 'http://localhost:5000', // Target your local Node.js server
          changeOrigin: true,
          secure: false, // Allow requests to an http target
        },
        
          // This proxy rule correctly intercepts API requests
          '/booking/api': {
            target: env.VITE_API_URL || 'https://xpresshotelpos.com',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/api/, '/booking/api'),
          },
        },
      },
      build: {
        outDir: "dist",
        sourcemap: isDev,
      },
      define: {
        // This ensures your application code (like main.jsx) knows the correct base path
        _API_BASE_: JSON.stringify(BASE_PATH),
  _BACKEND_URL_: JSON.stringify(
    env.VITE_API_URL || "https://xpresshotelpos.com/booking/api"
  ),
        // The ENCODED_STRING is no longer part of the base path,
        // but can still be passed to your app if needed.
        _ENCODED_STRING_: JSON.stringify(env.VITE_ENCODED_STRING || "QWVYSS9QVTREQjNLYzd0bjRZRTg4dz09"),
      },
    });
  }