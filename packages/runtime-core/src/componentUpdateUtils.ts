import type { VNode } from './vnode'

export function shouldUpdateComponent(
  prevVNode: VNode,
  nextVNode: VNode
): boolean {
  const { props: prevProps } = prevVNode
  const { props: nextProps } = nextVNode

  for (const key in nextProps) {
    if (nextProps[key] !== prevProps[key]) return true
  }

  return false
}
