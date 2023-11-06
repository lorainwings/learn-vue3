import { generate } from '../src/codegen'
import { baseParse } from '../src/parse'
import { transform } from '../src/transform'

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
})
