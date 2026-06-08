import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      tailwindcss(),
      nodePolyfills({
        // Polyfills needed by @react-pdf/renderer and its dependencies (pdfkit, etc.)
        include: ['buffer', 'process', 'stream', 'util', 'events', 'string_decoder'],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['@react-pdf/renderer'],
    },
    build: {
      commonjsOptions: {
        include: [/@react-pdf/, /node_modules/],
      },
    },
  };
});
