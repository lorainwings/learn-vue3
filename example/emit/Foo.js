import { h } from '../../lib/vue-next.esm.js'

export const Foo = {
  name: 'Foo',
  setup(props, { emit }) {
    const emitAdd = (...args) => {
      console.log('button click')
      emit('add', '----------emit called------------')
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
