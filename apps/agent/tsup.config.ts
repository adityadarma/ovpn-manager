import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/bin/openvpn-login.ts',
    'src/bin/openvpn-connect.ts',
    'src/bin/openvpn-disconnect.ts',
  ],
  format: ['esm'],
  target: 'node24',
  noExternal: ['@ovpn/shared'],
  clean: true,
  outExtension() {
    return {
      js: '.js',
    }
  },
})
