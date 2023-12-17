import { NodeTypes } from '../ast'

export function transformExpress(node) {
  if (node.type === NodeTypes.INTERPOLATION) {
    const rawContent = node.content.content
    node.content.content = `_ctx.${rawContent}`
  }
}
