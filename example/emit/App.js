import { h } from '../../packages/vue/dist/v-next.esm.js'
import { Foo } from './Foo.js'

export const App = {
  name: 'App',
  render() {
    // emit
    return h('div', {}, [
      h('div', {}, 'App'),
      h(Foo, {
        //  on+event name
        onAdd(...args) {
          console.log('onAdd', args)
        },
        // add-foo -> onAddFoo
        onAddFoo(...args) {
          console.log('onAddFoo', args)
        }
      })
    ])
  },
  setup() {
    return {}
  }
}
