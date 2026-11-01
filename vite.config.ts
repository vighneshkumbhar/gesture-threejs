import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'GestureThreeJS',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['three', '@mediapipe/hands'],
      output: {
        globals: {
          three: 'THREE',
          '@mediapipe/hands': 'Hands'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    exclude: ['@mediapipe/hands']
  }
});