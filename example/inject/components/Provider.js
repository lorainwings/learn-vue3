import { h, provide } from '../../../packages/vue/dist/v-next.esm.js'
import { Middle } from './Middle.js'

export const Provider = {
  name: 'Provider',
  setup() {
    provide('foo', 'fooValue')
    provide('bar', 'barValue')
  },
  render() {
    return h('div', {}, [h('p', {}, 'Provider'), h(Middle)])
  }
}
