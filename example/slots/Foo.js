import { h, renderSlots } from '../../lib/vue-next.esm.js'

export const Foo = {
  name: 'Foo',
  setup(props, { emit }) {
    return {}
  },
  render() {
    const foo = h('p', {}, 'foo')

    const age = 18
    return h('div', {}, [
      renderSlots(this.$slots, 'header', { age }),
      foo,
      /* Foo上层的children应该显示到此处 */
      // renderSlots
      /**
       *  实现具名插槽: 渲染到固定插槽思路
       *  1. 获取到要渲染的元素
       *  2. 要获取到渲染的位置
       *
       *  实现作用域插槽: 插槽的组件中能获取到子组件的作用域数据
       */
      renderSlots(this.$slots, 'footer')
    ])
  }
}
