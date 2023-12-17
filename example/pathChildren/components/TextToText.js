// 新的是 text
// 老的是 text
import { ref, h } from '../../../packages/vue/dist/v-next.esm.js'

const prevChildren = 'oldChild'
const nextChildren = 'newChild'

export default {
  name: 'TextToText',
  setup() {
    const isChange = (window.isChange = ref(false))

    return {
      isChange
    }
  },
  render() {
    return this.isChange === true
      ? h('div', {}, nextChildren)
      : h('div', {}, prevChildren)
  }
}
