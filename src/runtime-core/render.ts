import { isObject } from "../shared"
import { createComponentInstance, setupComponent } from "./component"


export function render(vnode, container) {
  // 调用patch
  patch(vnode, container)
}

function patch(vnode: any, container: any) {
  // 按类型处理vnode
  // 组件vode.type是个对象, 而普通元素vnode.type是个字符串

  if (typeof vnode.type === "string") {
    // 判断是不是element类型
    processElement(vnode, container)
  } else if (isObject(vnode.type)) {
    // 如果是组件类型
    processComponent(vnode, container)
  }
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

function processElement(vnode, container) {
  // 包含初始化和更新两个流程
  mountElement(vnode, container)
}

function mountElement(vnode: any, container: any) {
  // 分为普通元素string类型和一个子元素数组类型
  const el = document.createElement(vnode.type)
  const { children, props } = vnode
  if (typeof children === "string") {
    el.textContent = children
  } else if (Array.isArray(children)) {
    mountChildren(children, el)
  }
  for (const key in props) {
    const val = props[key]
    el.setAttribute(key, val)
  }

  container.append(el)
}

function mountChildren(children: any[], el: any) {
  children.forEach(v => {
    patch(v, el)
  })
}

