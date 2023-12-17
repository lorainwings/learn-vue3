import { h } from '../../packages/vue/dist/v-next.esm.js'

export const Foo = {
  name: 'Foo',
  setup(props, { emit }) {
    const emitAdd = () => {
      emit('add', '----------emit called------------', 2, 3, 4)
      emit('add-foo', '-----add-foo called----')
    }
    return {
      emitAdd
    }
  },
  render() {
    const btn = h('button', { onClick: this.emitAdd }, 'emitAdd')
    const foo = h('p', {}, 'foo')
    return h('div', {}, [foo, btn])
  }
}
