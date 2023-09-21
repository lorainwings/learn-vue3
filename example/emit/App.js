import { h } from '../../lib/vue-next.esm.js'
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
        }
      })
    ])
  },
  setup() {
    return {}
  }
}
