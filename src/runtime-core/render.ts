import { createComponentInstance, setupComponent } from "./component"


export function render(vnode, container) {
  // 调用patch
  patch(vnode, container)
}

function patch(vnode: any, container: any) {
  // 处理组件
  // 判断是不是element类型
  // processElement()

  // 如果是组件类型
  processComponent(vnode, container)
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container)
}

function mountComponent(vnode: any, container) {
  const instance = createComponentInstance(vnode)
  setupComponent(instance)
  setupRenderEffect(instance, container)
}


function setupRenderEffect(instance, container) {
  const subTree = instance.render()
  // sub vnode -> patch -> element -> mountElement
  patch(subTree, container)


}

