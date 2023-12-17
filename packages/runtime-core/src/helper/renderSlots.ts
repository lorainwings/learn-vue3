import { createVNode } from '../vnode'
import { Fragment } from '../vnode'

export function renderSlots(
  slots: Record<string, any>,
  name: string,
  slotScope: Record<string, any>
) {
  const slot = slots[name]
  // 需将slots包装为vnode
  if (slot) {
    if (typeof slot === 'function') {
      // 由于children不可以是数组, 因此实现了renderSlots
      // renderSlots待优化的点: 每个slot都会多了一层div
      // 此时将div改为Fragment
      return createVNode(Fragment, {}, slot(slotScope))
    }
  }
}
