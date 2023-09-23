import { getCurrentInstance } from './component'

export function provide(key: string, value: any) {
  // 数据存在哪里? 存在使用provide的组件实例上
  // 使用getCurrentInstance只能在setup函数中使用
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    const parentProvides = currentInstance.parent!.provides
    let { provides } = currentInstance
    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides)
    }
    provides[key] = value
  }
}

export function inject(
  key: string,
  defaultValue?: ((...args: unknown[]) => any) | string
) {
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    const { parent } = currentInstance
    const parentProvides = parent!.provides
    if (key in parentProvides) {
      return parentProvides[key]
    } else if (defaultValue) {
      if (typeof defaultValue === 'function') {
        return defaultValue()
      }
      return defaultValue
    }
  }
}
