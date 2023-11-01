export function generate(ast) {
  let code = ''
  code += 'return '
  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')

  code += `function ${functionName}(${signature}){`
  code += 'return `hi 1`'
  code += '}'

  return {
    code
  }
}
