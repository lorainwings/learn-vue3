import { hasOwn } from '@v-next/shared'

// 需要代理哪些常用响应属性
export const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  // $slots
  $slots: (i) => i.slots,
  $props: (i) => i.props
}

export const PublicInstanceProxyHandles = {
  get({ _: instance }, key) {
    // setupState
    const { setupState, props } = instance
    if (hasOwn(setupState, key)) {
      return setupState[key]
    } else if (hasOwn(props, key)) {
      return props[key]
    }

    // $el属性 | $slots属性
    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }

    // $data
  }
}
