import { isObject } from "../shared"
import { createComponentInstance, setupComponent } from "./component"
import type { ComponentInternalInstance } from "./component"
import type { VNode } from "./vnode"



export function render(vnode: VNode, container: HTMLElement) {
  // 调用patch
  patch(vnode, container)
}

function patch(vnode: VNode, container: HTMLElement) {
  // 按类型处理vnode
  // 组件vnode.type是个对象, 而普通元素vnode.type是个字符串

  if (typeof vnode.type === "string") {
    // 判断是不是element类型
    processElement(vnode, container)
  } else if (isObject(vnode.type)) {
    // 如果是组件类型
    processComponent(vnode, container)
  }
}

function processComponent(vnode: VNode, container: HTMLElement) {
  mountComponent(vnode, container)
}

function mountComponent(initialVnode: VNode, container: HTMLElement) {
  const instance = createComponentInstance(initialVnode)
  setupComponent(instance)
  setupRenderEffect(instance, initialVnode, container)
}


function setupRenderEffect(instance: ComponentInternalInstance, initialVnode: VNode, container: HTMLElement) {
  const { proxy } = instance
  // sub vnode -> patch -> element -> mountElement
  const subTree = instance.render.call(proxy)
  // 递归处理所有子节点
  patch(subTree, container)
  // 所有element已经处理完成
  initialVnode.el = subTree.el
}

function processElement(vnode: VNode, container: HTMLElement) {
  // 包含初始化和更新两个流程
  mountElement(vnode, container)
}

function mountElement(vnode: VNode, container: HTMLElement) {
  // 分为普通元素string类型和一个子元素数组类型
  const el = (vnode.el = document.createElement(vnode.type as string))
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

