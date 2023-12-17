import { defineConfig } from 'vitest/config'
import { join } from 'path'

export default defineConfig({
  test: {
    globals: true
  },
  resolve: {
    alias: [
      {
        find: /@v-next\/(.*)$/,
        replacement: join(__dirname, 'packages/$1/src')
      }
    ]
  }
})
