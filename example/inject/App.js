import { h } from '../../packages/vue/dist/v-next.esm.js'
import { Provider } from './components/Provider.js'

export const App = {
  name: 'App',
  setup() {},
  render() {
    return h('div', {}, [h('p', {}, '----api inject demo----'), h(Provider)])
  }
}
