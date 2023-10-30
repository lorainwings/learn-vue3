import { NodeTypes } from '../src/ast'
import { type AstNode, baseParse } from '../src/parse'
import { transform } from '../src/transform'

describe('transform', () => {
  it('happy path', () => {
    const ast = baseParse('<div>hello, {{message}}</div>')

    const plugin = (node) => {
      if (node.type === NodeTypes.TEXT) {
        node.content += 'world'
      }
    }
    transform(ast, {
      nodeTransforms: [plugin]
    })

    const nodeText = ast.children?.[0]?.children?.[0] as AstNode
    expect(nodeText.content).toBe('hello, world')
  })
})
