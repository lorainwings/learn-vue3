import { computed } from '../src/computed'
import { reactive } from '../src/reactive'
import { vi } from 'vitest'

describe('computed', () => {
  it('happy path', () => {
    // computed计算属性与ref类型, 调用也需要使用.value
    // 但是computed计算属性的value是可以缓存的
    const user = reactive({
      age: 1
    })
    const age = computed(() => {
      return user.age
    })
    expect(age.value).toBe(1)
  })

  it('should computed lazily', () => {
    const obj = reactive({
      foo: 1
    })
    const getter = vi.fn(() => {
      return obj.foo
    })
    const oValue = computed(getter)

    // lazy
    expect(getter).not.toHaveBeenCalled()
    expect(oValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(1)

    // should not compute again
    oValue.value
    expect(getter).toHaveBeenCalledTimes(1)

    // should not compute until needed
    // getter should be called only when get value
    obj.foo = 2
    expect(getter).toHaveBeenCalledTimes(1)

    // now it should compute
    expect(oValue.value).toBe(2)
    expect(getter).toHaveBeenCalledTimes(2)

    // should not compute again
    oValue.value
    expect(getter).toHaveBeenCalledTimes(2)
  })
})
