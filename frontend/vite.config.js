import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png', 'icons/*.png', 'sw.js'],
        injectRegister: false, // We'll register manually in App.jsx
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'sw.js',
        manifest: false, // Use existing manifest.json
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: isDevelopment ? {
        protocol: 'ws',
        host: 'localhost',
        port: 3000,
      } : false,
      proxy: isDevelopment ? {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        }
      } : undefined
    },
    build: {
      outDir: 'dist',
      sourcemap: isDevelopment,
      minify: !isDevelopment,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'chart-vendor': ['recharts'],
          }
        }
      }
    },
    preview: {
      port: 3000,
      host: true
    }
  };
});