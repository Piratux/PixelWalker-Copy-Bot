/**
 * Minimal Vite config used by vite-node when running CLI scripts (e.g. BomBotCli.ts).
 *
 * Intentionally excludes browser-only plugins (nodePolyfills, vue, eslint, checker)
 * so that real Node.js globals (process, Buffer, …) are used as-is.
 */
import { defineConfig } from 'vite'
import path from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
  },
  plugins: [tsconfigPaths()],
})
