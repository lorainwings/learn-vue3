import { h, inject, provide } from '../../../lib/vue-next.esm.js'
import { Consumer } from './Consumer.js'

export const Middle = {
  name: 'Middle',
  setup() {
    // 支持多级注入
    provide('foo', 'middleFooValue')
    const foo = inject('foo')
    return {
      foo
    }
  },
  render() {
    return h('div', {}, [h('p', {}, `parent foo: ${this.foo}`), h(Consumer)])
  }
}
