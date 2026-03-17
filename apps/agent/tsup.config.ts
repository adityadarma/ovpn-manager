import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/bin/vpn-login.ts',
    'src/bin/vpn-connect.ts',
    'src/bin/vpn-disconnect.ts',
  ],
  format: ['esm'],
  target: 'node24',
  noExternal: ['@vpn/shared'],
  clean: true,
  outExtension() {
    return {
      js: '.js',
    }
  },
})
