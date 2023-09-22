import { ShapeFlags } from '../shared/shapeFlags'
import { ComponentInternalInstance } from './component'
import { VNode } from './vnode'

export function initSlots(
  instance: ComponentInternalInstance,
  children: Record<string, (...args: unknown[]) => VNode | VNode[]>
) {
  // 不是所有的组件都有插槽, 因此需要判断
  const { vnode } = instance
  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    normalizeObjectSlots(children, instance)
  }
}

function normalizeObjectSlots(
  children: Record<string, (...args: unknown[]) => VNode | VNode[]>,
  instance: ComponentInternalInstance
) {
  // 为了实现具名插槽, 因此需要将children转换成对象
  const slots = {}
  for (const key in children) {
    const value = children[key]
    // slot
    slots[key] = (slotScope) => normalizeSlotValue(value(slotScope))
  }

  instance.slots = slots
}

function normalizeSlotValue<T extends VNode>(value: T | T[]): Array<T> {
  return Array.isArray(value) ? value : [value]
}
