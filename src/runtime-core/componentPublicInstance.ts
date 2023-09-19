// 需要代理哪些常用响应属性
export const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
}


export const PublicInstanceProxyHandles = {
  get({ _: instance }, key) {
    // setupState
    const { setupState } = instance
    if (key in setupState) {
      return Reflect.get(setupState, key)
    }

    // $el属性
    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }

    // $data
  }
}
