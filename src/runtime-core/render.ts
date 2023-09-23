import { ShapeFlags } from '../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'
import type { ComponentInternalInstance } from './component'
import { Fragment, Text, type VNode } from './vnode'

export function render(vnode: VNode, container: HTMLElement) {
  // 调用patch
  patch(vnode, container)
}

function patch(vnode: VNode, container: HTMLElement) {
  // 按类型处理vnode
  // 组件vnode.type是个对象, 而普通元素vnode.type是个字符串
  const { shapeFlag, type } = vnode
  //  实现Fragment,只渲染children
  switch (type) {
    case Fragment:
      processFragment(vnode, container)
      break
    case Text:
      processText(vnode, container)
      break
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // 判断是不是element类型
        processElement(vnode, container)
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        // 如果是组件类型
        processComponent(vnode, container)
      }
      break
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

function setupRenderEffect(
  instance: ComponentInternalInstance,
  initialVnode: VNode,
  container: HTMLElement
) {
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
  const { props, shapeFlag } = vnode
  // 处理children
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = vnode.children as string
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el)
  }
  // props
  for (const key in props) {
    const val = props[key]
    // 重构步骤, 从具体到抽象, 从一个具体的情况抽象为通用的情况
    const isOn = (key: string) => /^on[A-Z]/g.test(key)
    if (isOn(key)) {
      el.addEventListener(key.toLowerCase().replace(/on/, ''), props[key])
    } else {
      el.setAttribute(key, val)
    }
  }

  container.append(el)
}

function mountChildren(vnode: VNode, el: any) {
  ;(vnode.children as VNode[]).forEach((v) => {
    patch(v, el)
  })
}

function processFragment(vnode: VNode, container: HTMLElement) {
  mountChildren(vnode, container)
}

function processText(vnode: VNode, container: HTMLElement) {
  const { children } = vnode
  const textNode = (vnode.el = document.createTextNode(children as string))
  container.append(textNode)
}
