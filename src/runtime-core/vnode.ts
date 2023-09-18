export interface VNode {
  type: Record<string, any>
  props: Record<string, any>
  children: VNode[]
}

export function createVNode(type, props?, children?): VNode {
  const vnode = {
    // type就是原来的组件选项对象
    type,
    props,
    children
  }
  return vnode
}
