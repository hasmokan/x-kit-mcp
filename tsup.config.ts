import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'mcp-server.ts',
    'fetch-tweets': 'scripts/fetch-tweets.ts'
  },
  format: ['cjs'],
  dts: true,
  clean: true,
  outDir: 'dist',
  minify: false,
  splitting: false,
  sourcemap: true,
  shims: true,
  // noExternal: [/.*/],
  // bundle: true,
}) 