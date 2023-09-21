import { createVNode } from './vnode'
import { render } from './render'

export function createApp(rootComponent) {
  return {
    mount(rootContainer: HTMLElement) {
      /**
       *  1. 先转VNode
       *  */
      // 将入口component->转化成 VNode
      const vnode = createVNode(rootComponent)

      /**
       *  2. 后续所有逻辑操作都会基于VNode进行
       *  */
      render(vnode, rootContainer)
    }
  }
}
