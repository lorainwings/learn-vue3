import { proxyRefs } from '@v-next/reactivity'
import { shallowReadonly } from '@v-next/reactivity'
import { emit } from './componentEmit'
import { initProps } from './componentProps'
import { PublicInstanceProxyHandles } from './componentPublicInstance'
import { initSlots } from './componentSlots'
import type { VNode } from './vnode'
import type { Runner } from '@v-next/reactivity/src/effect'

type ProxyInstanceType<T = ProxyConstructor> = T extends new (
  ...args: any
) => infer R
  ? R
  : any

export interface ComponentInternalInstance {
  isMounted: boolean
  subTree: VNode
  vnode: VNode
  type: any
  render: (...args: any[]) => any
  proxy: ProxyInstanceType | null
  setupState: Record<string, any>
  props: Record<string, any>
  slots: Record<string, any>
  emit(...args: any[]): void
  provides: Record<string, any>
  parent: ComponentInternalInstance | null
  update: Runner
  next: null | VNode
}

let currentInstance: ComponentInternalInstance | null = null

export function createComponentInstance(vnode, parent) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    emit() {},
    provides: parent ? parent.provides : {},
    parent,
    isMounted: false,
    subTree: {},
    next: null // 下次要更新的虚拟节点
  } as ComponentInternalInstance

  component.emit = emit.bind(null, component)

  return component
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props)
  initSlots(instance, instance.vnode.children)
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type

  // 此处_用于传参
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandles)
  const { setup } = Component
  if (setup) {
    setCurrentInstance(instance)
    // function Object
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit
    })
    // setup调用完应该清空
    setCurrentInstance(null)
    handleSetupResult(instance, setupResult)
  }
}

function handleSetupResult(instance: any, setupResult: any) {
  // function Object
  // 实现function
  if (typeof setupResult === 'object') {
    // 为了模版中能直接访问ref的value值, 此处先进行拆包
    instance.setupState = proxyRefs(setupResult)
  }
  // 保证最终的组件render一定有值
  finishComponent(instance)
}

function finishComponent(instance: any) {
  const Component = instance.type

  // template -> render
  if (compiler && !Component.render) {
    if (Component.template) {
      Component.render = compiler(Component.template)
    }
  }
  instance.render = Component.render
}

export function getCurrentInstance() {
  return currentInstance
}

/**
 * 为何需要将currentInstance的set和get封装为函数?
 *
 * 如果不封装, 多处修改一个全局变量, 会导致代码难以维护和跟踪, 更容易出现bug
 * 封装统一的get和set方法, 便于后续调试和维护, 以及跟踪currentInstance的变化
 */
export function setCurrentInstance(instance: ComponentInternalInstance | null) {
  currentInstance = instance
}

let compiler
export function registerRuntimeCompiler(_compiler) {
  compiler = _compiler
}
