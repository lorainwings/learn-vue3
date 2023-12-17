import { isReactive, shallowReadonly } from '../src/reactive'
import { vi } from 'vitest'

describe('shallowReadonly', () => {
  it('should not make non-reactive properties reactive', () => {
    const props = shallowReadonly({ n: { foo: 1 } })
    expect(isReactive(props.n)).toBe(false)
  })

  it('warn then call set', () => {
    console.warn = vi.fn()
    const user = shallowReadonly({
      age: 10
    })
    user.age = 11
    expect(console.warn).toBeCalled()
  })
})
