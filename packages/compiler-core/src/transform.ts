import { NodeTypes } from './ast'
import type { AstNode, AstNodeElement } from './parse'
import { TO_DISPLAY_STRING } from './runtimeHeplers'

interface Transform {
  (node: AstNode, context): unknown
}
interface TransformOptions {
  nodeTransforms: Transform[]
}

type TransformContext = TransformOptions & {
  root: AstNode
  helpers: Map<symbol, any>
  helper(key: symbol): void
}

export function transform(
  root,
  options: TransformOptions = { nodeTransforms: [] }
) {
  const context: TransformContext = createTransformContext(root, options)
  // 1. 深度优先遍历ast
  traverseNode(root, context)
  // 2. 修改text content
  createRootCodegen(root)

  root.helpers = [...context.helpers.keys()]
}

function createTransformContext(
  root: AstNode,
  options: TransformOptions
): TransformContext {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map<symbol, any>(),
    helper(key: symbol): void {
      context.helpers.set(key, 1)
    }
  }
  return context
}

function traverseNode(node: AstNodeElement, context: TransformContext) {
  const { nodeTransforms } = context

  const exitFns: any = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    const onExit = transform(node, context)
    if (onExit) exitFns.push(onExit)
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break

    // case中没有break, 一旦满足该case条件开始执行当前case, 但后续的case将不再判断条件而直接执行, 直到遇到break跳出switch为止
    // 下面的写法类似于 if(NodeTypes.ROOT || NodeTypes.ELEMENT) 满足任一条件将执行
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context)
      break

    default:
      break
  }

  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}

function traverseChildren(node: AstNodeElement, context: TransformContext) {
  const children = node.children

  if (children) {
    children.forEach((child: any) => {
      traverseNode(child, context)
    })
  }
}

function createRootCodegen(root: AstNodeElement) {
  const child = root.children[0]
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode
  } else {
    root.codegenNode = root.children[0]
  }
}
