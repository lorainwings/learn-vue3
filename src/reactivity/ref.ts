import { reactive } from './reactive'
import { hasChanged, isObject } from '../shared'
import { isTracking, trackEffects, triggerEffects } from './effect'

interface Ref<T> {
  value: T
}

export class RefImpl {
  private _value: any
  private _rawValue: any
  public __v_isRef = true
  public deps = new Set()

  constructor(value) {
    this._rawValue = value
    // 如果value是对象, 则需要对对象用reactive进行代理
    this._value = convert(value)
  }
  get value() {
    trackRefValue(this)
    return this._value
  }
  set value(newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue
      // 必须先修改value的值
      this._value = convert(newValue)
      triggerEffects(this.deps)
    }
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value
}

export function trackRefValue(ref: RefImpl) {
  if (isTracking()) trackEffects(ref.deps)
}

export function ref<T>(value: T): Ref<T> {
  return new RefImpl(value)
}

export function isRef(ref): ref is RefImpl {
  return !!ref.__v_isRef
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref
}

// proxyRefs用于自动拆包, 即不需要.value来访问ref值
// 使用场景一般在template中, template中不需要.value来访问ref值
export function proxyRefs<T extends Object>(
  objectWithRefs: T
): Record<string, any> {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key))
    },
    set(target, key, value) {
      const o = Reflect.get(target, key)
      // 源对象是ref对象, 但是新值不是ref对象, 则直接修改ref对象的value值
      if (isRef(o) && !isRef(value)) {
        return (target[key].value = value)
      } else {
        return Reflect.set(target, key, value)
      }
    }
  })
}
