import type { AstNode, AstNodeElement } from './parse'

interface Transform {
  (node: AstNode): unknown
}
interface TransformOptions {
  nodeTransforms: Transform[]
}

type TransformContext = TransformOptions & {
  root: AstNode
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

function traverseNode(node: AstNodeElement, context: TransformContext) {
  const { nodeTransforms } = context
  nodeTransforms.forEach((transform) => transform(node))
  traverseChildren(node, context)
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
  root.codegenNode = root.children[0]
}
