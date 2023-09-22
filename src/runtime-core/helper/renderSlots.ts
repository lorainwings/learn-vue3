import { createVNode } from '../vnode'

export function renderSlots(
  slots: Record<string, any>,
  name: string,
  slotScope: Record<string, any>
) {
  const slot = slots[name]
  // 需将slots包装为vnode
  if (slot) {
    if (typeof slot === 'function') {
      return createVNode('div', {}, slot(slotScope))
    }
  }
}
