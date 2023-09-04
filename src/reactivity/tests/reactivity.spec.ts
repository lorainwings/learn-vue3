import { reactive } from "../reactive"


describe('reactive', () => {
  it('reactive data be proxied', () => {
    const original = { foo: 1 }
    const observed = reactive(original)

    expect(observed).not.toBe(original)
    // 这种情况下, 会触发get函数, 然后调用track, 此时track中的activeEffect为undefined
    expect(observed.foo).toBe(1)
  })
})
