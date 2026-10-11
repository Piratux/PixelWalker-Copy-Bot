import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import tsconfigPaths from 'vite-tsconfig-paths'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import eslint from 'vite-plugin-eslint2'
import checker from 'vite-plugin-checker'
import { playwright } from '@vitest/browser-playwright'
import { createServer as createDocsServer } from 'vitepress'

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: '/PixelWalker-Copy-Bot/',
    plugins: [
      {
        name: 'documentation',
        async configureServer(server) {
          const docsServer = await createDocsServer(path.resolve(__dirname, 'docs'), {
            middlewareMode: true,
            hmr: server.httpServer === null ? undefined : { server: server.httpServer, path: 'docs-hmr' },
          })
          server.httpServer?.once('close', () => {
            void docsServer.close()
          })
          server.middlewares.use((request, response, next) => {
            const pathname = request.url?.split('?')[0] ?? ''
            if (pathname === '/PixelWalker-Copy-Bot/docs') {
              response.writeHead(302, { Location: '/PixelWalker-Copy-Bot/docs/' })
              response.end()
            } else if (pathname.startsWith('/PixelWalker-Copy-Bot/docs/')) {
              docsServer.middlewares(request, response, next)
            } else {
              next()
            }
          })
        },
      },
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
    // vitest config
    test: {
      // Uncomment for debugging tests
      // inspectBrk: true,
      fileParallelism: false,
      watch: true,
      browser: {
        enabled: true,
        provider: playwright(),
        // https://vitest.dev/guide/browser/playwright
        instances: [{ browser: 'chromium' }],
        headless: true,
        screenshotFailures: false,
      },
      coverage: {
        reporter: ['html'],
        exclude: ['src/test/**', 'src/**/gen/**'],
      },
      setupFiles: './src/test/VitestSetup.ts',
      isolate: false, // necessary for setupFiles to not have fresh context for each test file run. That way bot doesn't need to be reconnected for each test file.
    },
  }
})
