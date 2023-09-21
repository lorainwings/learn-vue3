import { ReactiveEffect } from './effect'

class ComputedRefImpl {
  private _value: unknown
  // private _getter: () => unknown;
  // 如果脏值, 就获取新值, 否则使用缓存值
  private _isDirty: boolean = true
  private _effect: ReactiveEffect

  constructor(getter) {
    // this._getter = getter;
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._isDirty) this._isDirty = true
    })
  }
  get value() {
    // 当依赖的响应式对象的值发生变化的时候, 就需要改变_isDirty = true
    // 因此也需要知道什么时候响应式变量发生变化, 因此就需要使用effect

    if (this._isDirty) {
      this._isDirty = false
      this._value = this._effect.run()
    }
    return this._value
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter)
}
