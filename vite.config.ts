import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      } as any,
    },
    chunkSizeWarningLimit: 1000, // 1MB warning threshold
    rollupOptions: {
      output: {
        // Manual code splitting strategy
        manualChunks(id) {
          // Vendor libraries - isolate heavy dependencies
          if (id.includes('node_modules/react')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/@headlessui')) {
            return 'vendor-ui';
          }
          if (id.includes('node_modules/axios') || id.includes('node_modules/zustand')) {
            return 'vendor-utils';
          }
        },
      },
    },
  },
});
