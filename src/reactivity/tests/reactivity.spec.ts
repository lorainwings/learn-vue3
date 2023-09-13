import { isReactive, reactive } from "../reactive"


describe('reactive', () => {
  it('reactive data be proxied', () => {
    const original = { foo: 1 }
    const observed = reactive(original)

    expect(observed).not.toBe(original)
    // 这种情况下, 会触发get函数, 然后调用track, 此时track中的activeEffect为undefined
    expect(observed.foo).toBe(1)
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
  })

  it('nested reactive data be proxied', () => {
    const original = { nested: { foo: 1 }, array: [{ bar: 2 }] }
    const observed = reactive(original)
    expect(isReactive(observed.nested)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true)
  })
})
