import { generate } from '../src/codegen'
import { baseParse } from '../src/parse'
import { transform } from '../src/transform'
import { transformElement } from '../src/transform/transformElement'
import { transformExpress } from '../src/transform/transformExpression'
import { transformText } from '../src/transform/transformText'

describe('codegen', () => {
  it('string', () => {
    const ast = baseParse('hi')
    transform(ast)
    const { code } = generate(ast)
    // 快照测试
    // 1. 抓出错误
    // 2. 主动更新快照
    expect(code).toMatchSnapshot()
  })
  it('interpolation', () => {
    const ast = baseParse('{{message}}')
    transform(ast, {
      nodeTransforms: [transformExpress]
    })
    const { code } = generate(ast)
    expect(code).toMatchSnapshot()
  })

  it('element', () => {
    const ast = baseParse('<div>hi, {{message}}</div>')
    transform(ast, {
      nodeTransforms: [transformExpress, transformElement, transformText]
    })

    const { code } = generate(ast)
    expect(code).toMatchSnapshot()
  })
})
