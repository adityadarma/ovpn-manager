import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/migrate.ts',
    'src/seed.ts',
    'src/migrations/*.ts',
    'src/seeds/*.ts'
  ],
  format: ['esm'],
  target: 'node24',
  clean: true,
  outExtension() {
    return {
      js: '.js',
    }
  },
})
