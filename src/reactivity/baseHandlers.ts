import { track, trigger } from "./effect"
import { ReactiveFlags } from "./reactive"

// 防止每次引用都会执行一次createGetter/createSetter
// 缓存之后, 只会创建一次
const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)

function createGetter(isReadonly = false) {
  return function get(target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) return !isReadonly
    if (key === ReactiveFlags.IS_READONLY) return isReadonly

    const res = Reflect.get(target, key)
    if (!isReadonly) {
      track(target, key)
    }
    return res
  }
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);
    trigger(target, key)
    return res
  }
}


export const mutableHandlers = {
  get,
  set
}



export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`cannot set readonly property ${key}`)
    return true
  }
}