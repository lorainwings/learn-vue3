import { h, getCurrentInstance } from '../../packages/vue/dist/v-next.esm.js'
import { Foo } from './Foo.js'

export const App = {
  name: 'App',
  render() {
    return h('div', {}, [h('p', {}, 'currentInstance demo'), h(Foo)])
  },
  setup() {
    const instance = getCurrentInstance()
    console.log('currentInstance App', instance)
  }
}
