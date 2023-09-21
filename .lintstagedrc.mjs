export default {
  '*.{js,ts}': ['pnpm run lint:fix'],
  '*.{json,md,html,css,scss,sass,less,styl}': [
    'prettier --write --list-different'
  ]
}
