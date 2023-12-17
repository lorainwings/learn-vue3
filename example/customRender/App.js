import { h } from '../../packages/vue/dist/v-next.esm.js'

export const App = {
  name: 'App',
  render() {
    return h('rect', { x: this.x, y: this.y })
  },
  setup() {
    return {
      x: 100,
      y: 100
    }
  }
}
