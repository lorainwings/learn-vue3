module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  transformIgnorePatterns: ['./node_modules/'],
  moduleDirectories: ['node_modules', 'packages'],
  moduleNameMapper: {
    '^@v-next/shared$': '@v-next/shared/src',
    '^@v-next/runtime-dom$': '@v-next/runtime-dom/src',
    '^@v-next/runtime-core$': '@v-next/runtime-core/src'
  }
}
