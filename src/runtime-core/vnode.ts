import { ShapeFlags } from "../shared/shapeFlags"

export interface VNode {
  type: Record<string, any> | string
  props: Record<string, any>
  children: VNode[] | string,
  shapeFlag: ShapeFlags,
  el: null | HTMLElement
}

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
  return vnode
}
function getShapeFlag(type: Record<string, any> | string) {
  return typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT
}

