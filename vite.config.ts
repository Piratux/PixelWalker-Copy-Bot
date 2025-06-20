import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import tsconfigPaths from 'vite-tsconfig-paths'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import eslint from 'vite-plugin-eslint2'
import checker from 'vite-plugin-checker'

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: '/PixelWalker-Copy-Bot/',
    plugins: [
      vue(),
      tsconfigPaths(),
      nodePolyfills(),
      eslint(),
      checker({
        vueTsc: true,
      }),
    ],
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext',
      },
    },
    build: {
      target: 'esnext',
    },

    server: {
      host: 'localhost',
      port: 3000,
    },

    resolve: {
      alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
    },
  }
})
