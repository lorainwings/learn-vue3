// 新的是 array
// 老的是 text
import { ref, h } from '../../../packages/vue/dist/v-next.esm.js'

const prevChildren = 'oldChild'
const nextChildren = [h('div', {}, 'A'), h('div', {}, 'B')]

export default {
  name: 'TextToArray',
  setup() {
    const isChange = (window.isChange = ref(false))

    return {
      isChange
    }
  },
  render() {
    console.log('?????????')

    return this.isChange === true
      ? h('div', {}, nextChildren)
      : h('div', {}, prevChildren)
  }
}
