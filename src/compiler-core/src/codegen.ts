import { NodeTypes } from './ast'
import type { AstNodeElement } from './parse'
import { TO_DISPLAY_STRING, helperMapName } from './runtimeHeplers'

interface ICodegenContext {
  code: string
  push(source: string): void
  helper(key: symbol): string
}

export function generate(ast: AstNodeElement) {
  const context = createCodegenContext()
  const { push } = context

  genFunctionPreamble(ast, context)

  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')

  // console.log('--ast', ast)

  push(`function ${functionName}(${signature}){`)
  push('return ')
  genNode(ast.codegenNode, context)
  push('}')

  return { code: context.code }
}

// 导入模块逻辑处理
function genFunctionPreamble(ast: AstNodeElement, context) {
  const { push } = context
  const VueBinging = 'Vue'
  const aliasHelper = (s) => `${s}:_${s}`
  if (ast.helpers.length > 0) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`)
  }
  push('\n')
  push('return ')
}

function genNode(
  node: AstNodeElement | undefined,
  context: ICodegenContext
): void {
  switch (node?.type) {
    case NodeTypes.TEXT:
      genText(node, context)
      break

    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break

    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break

    default:
      break
  }
}

function genText(node: AstNodeElement, context: ICodegenContext) {
  const { push } = context
  push(`'${node!.content}'`)
}

function createCodegenContext(): ICodegenContext {
  const context = {
    code: '',
    push(source) {
      context.code += source
    },
    helper(key: symbol) {
      return `_${helperMapName[key]}`
    }
  }
  return context
}

function genInterpolation(node: AstNodeElement, context: ICodegenContext) {
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content as AstNodeElement, context)
  push(')')
}

function genExpression(node: AstNodeElement, context: ICodegenContext) {
  const { push } = context
  push(`${node.content}`)
}
