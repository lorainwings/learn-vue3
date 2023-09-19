export interface VNode {
  type: Record<string, any> | string
  props: Record<string, any>
  children: VNode[],
  el: null | HTMLElement
}

export function createVNode(type, props?, children?): VNode {
  const vnode = {
    // type就是原来的组件选项对象
    type,
    props,
    children,
    el: null
  }
  return vnode
}
