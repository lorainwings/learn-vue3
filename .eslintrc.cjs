module.exports = {
  root: true,
  extends: [
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    // 防止'return \'string\''这种多重转义, 而是使用"return 'string'"
    quotes: ['error', 'single', { avoidEscape: true }],
    // semi: ['error', 'never'],
    indent: 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/comma-dangle': 'off'
  }
}
