import { effect } from '../reactivity'
import { EMPTY_PROPS } from '../shared'
import { ShapeFlags } from '../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'
import type { ComponentInternalInstance } from './component'
import { createAppAPI } from './createApp'
import { Fragment, Text, type VNode } from './vnode'

interface RendererOptions {
  createElement: (type: any) => any
  patchProp: (el: any, key: string, val: any, next: any) => void
  insert: (child: any, parent: any, anchor?: any) => void
  remove: (child: any) => void
  setElementText: (el: any, text: string) => void
}

export function createRenderer(options: RendererOptions) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText
  } = options

  function render(vnode: VNode, container: HTMLElement) {
    // 调用patch
    patch(null, vnode, container, null, null)
  }

  // n1 老虚拟节点
  // n2 新虚拟节点
  function patch(
    n1: VNode | null,
    n2: VNode,
    container: HTMLElement,
    parentComponent,
    anchor
  ) {
    // 按类型处理vnode
    // 组件vnode.type是个对象, 而普通元素vnode.type是个字符串
    const { shapeFlag, type } = n2
    //  实现Fragment,只渲染children
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 判断是不是element类型
          processElement(n1, n2, container, parentComponent, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 如果是组件类型
          processComponent(n1, n2, container, parentComponent, anchor)
        }
        break
    }
  }

  function processComponent(
    n1: VNode | null,
    n2: VNode,
    container: HTMLElement,
    parentComponent,
    anchor
  ) {
    mountComponent(n2, container, parentComponent, anchor)
  }

  function mountComponent(
    initialVnode: VNode,
    container: HTMLElement,
    parentComponent: ComponentInternalInstance | null,
    anchor
  ) {
    const instance = createComponentInstance(initialVnode, parentComponent)
    setupComponent(instance)
    setupRenderEffect(instance, initialVnode, container, anchor)
  }

  function setupRenderEffect(
    instance: ComponentInternalInstance,
    initialVnode: VNode,
    container: HTMLElement,
    anchor
  ) {
    effect(() => {
      // 初始化流程
      if (!instance.isMounted) {
        console.log('init')
        const { proxy } = instance
        // sub vnode -> patch -> element -> mountElement
        const subTree = (instance.subTree = instance.render.call(proxy))
        // 递归处理所有子节点
        patch(null, subTree, container, instance, anchor)
        // 所有element已经处理完成
        initialVnode.el = subTree.el
        instance.isMounted = true
      }
      // 更新流程
      else {
        console.log('update')
        const { proxy } = instance
        const subTree = instance.render.call(proxy)
        const prevSubTree = instance.subTree
        instance.subTree = subTree
        patch(prevSubTree, subTree, container, instance, anchor)
      }
    })
  }

  function processElement(
    n1: VNode | null,
    n2: VNode,
    container: HTMLElement,
    parentComponent,
    anchor
  ) {
    // 包含初始化和更新两个流程
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor)
    } else {
      patchElement(n1, n2, container, parentComponent, anchor)
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log('patchElement', n1, n2)

    // 值是不可变的, 不能直接修改props的变量值, 而是去更新容器上面的属性值
    const oldProps = n1.props || EMPTY_PROPS
    const newProps = n2.props || EMPTY_PROPS
    const el = (n2.el = n1.el)
    patchChildren(n1, n2, el, parentComponent, anchor)
    patchProps(el, oldProps, newProps)
  }

  function patchChildren(
    n1: VNode,
    n2: VNode,
    container: HTMLElement,
    parentComponent,
    anchor
  ) {
    const prevShapeFlag = n1.shapeFlag
    const c1 = n1.children
    const shapeFlag = n2.shapeFlag
    const c2 = n2.children

    /**
     * 新旧子节点就两种类型, 文本节点和数组节点, 通过两两组合就形成四种条件
     */
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      /**
       * 场景一: 老节点是数组节点, 新节点是文本节点
       * 操作步骤: 将老节点的子节点全部删除, 然后将新节点的文本节点插入到容器中
       */
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1. 把老的children清空
        unmountChildren(c1)
        // 2. 设置新的text, 与场景二合并该操作
        // hostSetElementText(container, c2 as string)
      }

      /**
       * 场景二: 老节点是文本节点, 新节点也是文本节点
       * 操作步骤: 直接修改文本节点的内容
       */
      if (c1 !== c2) {
        hostSetElementText(container, c2 as string)
      }
    } else {
      /**
       * 场景三: 老节点是文本节点, 新节点是数组节点
       * 操作步骤: 清空老节点的文本节点, 然后把新节点的数组节点mount到容器中
       */
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 1. 把老的节点先清空
        hostSetElementText(container, '')
        // 2. 把新节点mount到容器中
        mountChildren(c2 as VNode[], container, parentComponent, anchor)
      } else {
        /**
         * 场景四: 老节点是数组节点, 新节点也是数组节点
         * 操作步骤: 通过diff算法对比新老节点, 然后更新, 也是最复杂的最核心的场景
         */
        patchKeyedChildren(c1, c2, container, parentComponent, anchor)
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    const l2 = c2.length
    let i = 0 // 老节点的头指针
    let e1 = c1.length - 1 // 老节点的尾指针
    let e2 = l2 - 1 // 新节点的尾指针

    function isSameNodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key
    }

    // case1: 从左侧开始对比, 用于锁定范围
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]

      if (isSameNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break
      }
      i++
    }

    // case2: 从右侧开始对比, 用于锁定范围
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break
      }
      e1--
      e2--
    }

    // case3: 新节点比老节点长, 需要创建, 包含了右侧和左侧对比
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1
        const anchor = nextPos < l2 ? c2[nextPos].el : null
        while (i <= e2) {
          // 从i 到 e2 循环创建
          patch(null, c2[i], container, parentComponent, anchor)
          i++
        }
      }
    }
    // case4: 老节点比新节点长, 需要删除
    else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el
      hostRemove(el)
    }
  }

  /**
   * patchProps 几种情况
   * 场景一. 前后都有属性值, 后面的值不一样了, 属于修改
   * 场景二. 前面有属性, 后面变为null或者undefined, 属于删除
   * 场景三. 前面有属性, 后面没有属性, 属于删除
   */
  function patchProps(
    el,
    oldProps: Record<string, unknown>,
    newProps: Record<string, unknown>
  ) {
    if (oldProps !== newProps) {
      // 场景一
      for (const key in newProps) {
        const prevProp = oldProps[key]
        const nextProp = newProps[key]
        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp)
        }
      }

      if (oldProps !== EMPTY_PROPS) {
        // 场景二
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }

  function mountElement(
    vnode: VNode,
    container: HTMLElement,
    parentComponent,
    anchor
  ) {
    // 分为普通元素string类型和一个子元素数组类型

    // 此处是使用DOM API创建真实DOM元素, 为了兼容自定义渲染器, 因此需要重构
    // const el = (vnode.el = document.createElement(vnode.type as string))

    // 重构为创建元素的函数, 函数中判断平台然后调用对应平台创建API
    const el = (vnode.el = hostCreateElement(vnode.type))

    const { props, shapeFlag } = vnode
    // 处理children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = vnode.children as string
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children as VNode[], el, parentComponent, anchor)
    }
    // props
    for (const key in props) {
      const val = props[key]
      // 重构步骤, 从具体到抽象, 从一个具体的情况抽象为通用的情况

      /**
       * 此处也需要重构到通用的创建props的函数
       */
      /* const isOn = (key: string) => /^on[A-Z]/g.test(key)
      if (isOn(key)) {
        const event = key.toLowerCase().replace(/on/, '')
        el.addEventListener(event, val)
      } else {
        el.setAttribute(key, val)
      } */
      hostPatchProp(el, key, null, val)
    }

    // container.append(el)
    hostInsert(el, container, anchor)
  }

  function mountChildren(children: VNode[], el: any, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, el, parentComponent, anchor)
    })
  }

  function processFragment(
    n1: VNode | null,
    n2: VNode,
    container: HTMLElement,
    parentComponent,
    anchor
  ) {
    mountChildren(n2.children as VNode[], container, parentComponent, anchor)
  }

  function processText(n1: VNode | null, n2: VNode, container: HTMLElement) {
    const { children } = n2
    const textNode = (n2.el = document.createTextNode(children as string))
    container.append(textNode)
  }

  return {
    createApp: createAppAPI(render)
  }
}
