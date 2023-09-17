export interface ComponentInternalInstance {
  type: any
  render?: (...args: unknown[]) => void
}

export function createComponentInstance(vnode) {
  const component = {
    type: vnode.type
  } satisfies ComponentInternalInstance
  return component
}

export function setupComponent(instance) {
  // initProps()
  // initSlots()
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type
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
  // ???
  if (!Component.render) {
    instance.render = Component.render
  }
}

