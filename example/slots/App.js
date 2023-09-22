import { h } from '../../lib/vue-next.esm.js'
import { Foo } from './Foo.js'

export const App = {
  name: 'App',
  render() {
    const comp = h('div', {}, 'Comp')
    /**
     * 此时slots是数组, 无法精确获取到要渲染的元素, 因此改写为object, 通过key精确获取元素
     */
    const FooSlot = h(
      Foo,
      {},
      /* -----------以下功能点一个个依次实现, 实现渐进增强----------- */
      /**
       * slots内容这块应该显示到Foo内部的插槽内
       * 首先支持单个VNode和VNode数组
       */
      // h('p', {}, '整行h都是个slots') // slots是一个vnode
      // [h('p', {}, '123'), h('p', {}, '456')] // slots是一个数组

      /**
       * 具名插槽的插槽内容应该显示到具名插槽内
       * 实现具名插槽: 渲染到固定插槽思路
       */
      /* {
        header: h('p', {}, 'header' + age), // 将slots改为object
        footer: h('p', {}, 'footer')
      } */

      /**
       *  实现作用域插槽: 插槽的组件中能获取到子组件的作用域数据
       *
       *  插槽能读取当前父组件中的数据, 但是直接读取子组件中的数据
       *  作用域插槽能获取到子组件的作用域数据, 但是子组件的作用域数据是在子组件中定义的
       *  因此需要在子组件中定义一个函数, 通过函数的参数获取到子组件的作用域数据
       */
      {
        header: ({ age }) => h('p', {}, 'header' + age), // 将slots改为object
        footer: () => h('p', {}, 'footer')
      }
    )
    return h('div', {}, [comp, FooSlot])
  },
  setup() {
    return {}
  }
}
