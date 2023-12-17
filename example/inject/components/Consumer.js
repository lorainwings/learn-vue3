import { h, inject } from '../../../packages/vue/dist/v-next.esm.js'

export const Consumer = {
  name: 'Consumer',
  setup() {
    const foo = inject('foo')
    const bar = inject('bar')
    // 支持默认值
    // const baz = inject('baz', 'defaultBaz')
    // 支持函数
    const baz = inject('baz', () => 'defaultBaz')
    return {
      foo,
      bar,
      baz
    }
  },
  render() {
    return h('div', {}, `Consumer- ${this.foo} - ${this.bar}- ${this.baz}`)
  }
}
