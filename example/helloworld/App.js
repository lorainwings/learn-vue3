import { h, reactive } from '../../packages/vue/dist/v-next.esm.js'
import { Foo } from './Foo.js'

export const App = {
  // .vue3
  // template
  name: 'App',
  render() {
    window.self = this
    return h(
      'div',
      {
        id: 'root',
        class: ['red', 'hard'],
        onClick() {
          console.log('click event')
        },
        onMousedown() {
          console.log('onMousedown')
        }
      },
      // `hi, ${this.msg}`
      // [h("p", { class: 'red' }, 'hello ' + this.msg), h("p", { class: 'blue' }, 'my-vue3')]
      [h('div', {}, 'hi' + this.msg + this.her[0].name), h(Foo, { count: 1 })]
    )
  },
  setup() {
    const her = reactive([
      { index: 1, name: 'zs' },
      { index: 2, name: 'ls' }
    ])

    console.log('her', (her[0].name = '张丹很清纯'))

    // composition api
    return {
      msg: 'my-vue3'
    }
  }
}
