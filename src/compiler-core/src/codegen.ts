import type { AstNodeElement } from './parse'

interface ICodegenContext {
  code: string
  push(source: string): void
}
export function generate(ast: AstNodeElement) {
  const context = createCodegenContext()
  const { push } = context
  push('return ')
  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')

  push(`function ${functionName}(${signature}){`)
  push('return ')
  genNode(ast.codegenNode, context)
  push('}')

  return { code: context.code }
}

function genNode(node: AstNodeElement | undefined, context: ICodegenContext) {
  const { push } = context
  push(`'${node!.content}'`)
}

function createCodegenContext(): ICodegenContext {
  const context = {
    code: '',
    push(source) {
      context.code += source
    }
  }
  return context
}
