import typescript, { RollupTypescriptOptions } from '@rollup/plugin-typescript'
import alias from '@rollup/plugin-alias'
import path from 'path'

const config: RollupTypescriptOptions = {
  input: './packages/vue/src/index.ts',
  output: [
    {
      format: 'cjs',
      file: 'packages/vue/dist/v-next.cjs.js'
    },
    {
      format: 'es',
      sourcemap: true,
      file: 'packages/vue/dist/v-next.esm.js'
    }
  ],
  plugins: [
    typescript(),
    alias({
      entries: [
        {
          find: /^@v-next\/(.*)$/,
          replacement: path.join(__dirname, 'packages/$1/src')
        }
      ]
    })
  ]
}

export default config
