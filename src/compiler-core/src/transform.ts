import { AstNode } from './parse'

interface Transform {
  (node: AstNode): unknown
}
interface TransformOptions {
  nodeTransforms: Transform[]
}

type TransformContext = TransformOptions & {
  root: AstNode
}

export function transform(root, options: TransformOptions) {
  const context: TransformContext = createTransformContext(root, options)
  // 1. 深度优先遍历ast
  traverseNode(root, context)
  // 2. 修改text content
}

function createTransformContext(
  root: AstNode,
  options: TransformOptions
): TransformContext {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || []
  }
  return context
}

function traverseNode(node: AstNode, context: TransformContext) {
  const { nodeTransforms } = context
  nodeTransforms.forEach((transform) => transform(node))
  traverseChildren(node, context)
}

function traverseChildren(node: AstNode, context: TransformContext) {
  const children = node.children

  if (children) {
    children.forEach((child: any) => {
      traverseNode(child, context)
    })
  }
}
