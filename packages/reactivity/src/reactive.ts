import { isObject } from '@v-next/shared'
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers
} from './baseHandlers'

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly'
}

export function reactive(raw) {
  return createActiveObject(raw, mutableHandlers)
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers)
}
/* shallow只代理最外层的响应式, 内层不代理 */
export function shallowReadonly<T>(raw: T): T {
  return createActiveObject(raw, shallowReadonlyHandlers)
}

export function createActiveObject(raw, handlers) {
  if (!isObject(raw)) {
    console.warn(`target ${raw} 必须是一个对象`)
    return raw
  }
  return new Proxy(raw, handlers)
}

export function isReactive(obj) {
  return !!obj[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(obj) {
  return !!obj[ReactiveFlags.IS_READONLY]
}

export function isProxy(obj) {
  return isReactive(obj) || isReadonly(obj)
}
