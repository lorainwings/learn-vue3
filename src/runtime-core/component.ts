import { PublicInstanceProxyHandles } from "./componentPublicInstance"
import type { VNode } from "./vnode"

type ProxyInstanceType<T = ProxyConstructor> = T extends new (...args: any) => infer R ? R : any

export interface ComponentInternalInstance {
  vnode: VNode
  type: any
  render: (...args: any[]) => any
  proxy: ProxyInstanceType | null
}

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type
  } as ComponentInternalInstance
  return component
}

export function setupComponent(instance) {
  // initProps()
  // initSlots()
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type

  // 此处_用于传参
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandles)
  const { setup } = Component
  if (setup) {
    // function Object
    const setupResult = setup()
    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(instance: any, setupResult: any) {
  // function Object
  // 实现function
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult
  }
  // 保证最终的组件render一定有值
  finishComponent(instance)
}

function finishComponent(instance: any) {
  const Component = instance.type

  instance.render = Component.render
}

