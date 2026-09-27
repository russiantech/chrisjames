import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  // loadEnv reads .env files for the current mode — available at build time
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      port: 5173,
      proxy: {
        // Dev only: browser hits localhost:5173/api → forwarded to local FastAPI.
        // Same-origin, so cookies/auth headers behave exactly like prod.
        '/api':   { target: env.VITE_DEV_API_TARGET ?? 'http://localhost:8000', changeOrigin: true },
        '/media': { target: env.VITE_DEV_API_TARGET ?? 'http://localhost:8000', changeOrigin: true },
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            query: ['@tanstack/react-query'],
          },
        },
      },
    },
  };
});
