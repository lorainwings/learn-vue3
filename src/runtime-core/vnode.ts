import { isObject } from '../shared'
import { ShapeFlags } from '../shared/shapeFlags'

export interface VNode {
  type: Record<string, any> | string | symbol
  props: Record<string, any>
  children: VNode[] | string
  shapeFlag: ShapeFlags
  el: null | HTMLElement | Text
}

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

export function createVNode(type, props?, children?): VNode {
  const vnode = {
    // type就是原来的组件选项对象
    type,
    props,
    children,
    shapeFlag: getShapeFlag(type),
    el: null
  }
  // children type
  if (typeof children === 'string') {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }

  // 必须是组件类型, 且children是一个object, 那么就是一个slot类型
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (isObject(children)) {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN
    }
  }

  return vnode
}
function getShapeFlag(type: Record<string, any> | string) {
  return typeof type === 'string'
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT
}

export function createTextVNode(text: string) {
  return createVNode(Text, {}, text)
}
