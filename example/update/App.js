import { h, ref } from '../../lib/vue-next.esm.js'

export const App = {
  name: 'App',
  setup() {
    const count = ref(0)
    const onClick = () => count.value++
    return {
      count,
      onClick
    }
  },
  render() {
    // this.count 需要自动拆包
    return h(
      'div',
      {
        id: 'root'
      },
      [
        h('div', {}, 'count:' + this.count),
        h('button', { onClick: this.onClick }, 'add count')
      ]
    )
  }
}
