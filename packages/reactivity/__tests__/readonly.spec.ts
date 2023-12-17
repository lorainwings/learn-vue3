import { isReadonly, readonly } from '../src/reactive'
import { vi } from 'vitest'

describe('readonly', () => {
  it('happy path', () => {
    // 无法被set, 不需要收集依赖
    const original = { foo: 1, bar: { baz: 2 } }
    const wrapped = readonly(original)
    expect(wrapped).not.toBe(original)
    expect(wrapped.foo).toBe(1)
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(original)).toBe(false)
    expect(isReadonly(wrapped.bar)).toBe(true)
    expect(isReadonly(original.bar)).toBe(false)
  })

  // it.skip 用于跳过当前用例
  // vi.fn 用于模拟函数, 用于测试函数是否被调用
  // 命令pnpm test xxx(例如本例readonly) 可以单独测试某个用例
  it('warn then call set', () => {
    console.warn = vi.fn()
    const user = readonly({
      age: 10
    })
    user.age = 11
    expect(console.warn).toBeCalled()
  })
})
