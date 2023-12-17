import { h } from '../../packages/vue/dist/v-next.esm.js'
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
      [h('div', {}, 'hi' + this.msg), h(Foo, { count: 1 })]
    )
  },
  setup() {
    // composition api
    return {
      msg: 'my-vue3'
    }
  }
}
