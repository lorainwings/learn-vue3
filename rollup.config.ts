import typescript, { RollupTypescriptOptions } from '@rollup/plugin-typescript'
import { readFileSync } from 'fs'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), { encoding: 'utf8' })
)

const config: RollupTypescriptOptions = {
  input: './src/index.ts',
  output: [
    {
      format: 'cjs',
      file: pkg.main
    },
    {
      format: 'es',
      sourcemap: true,
      file: pkg.module
    }
  ],
  plugins: [typescript()]
}

export default config
