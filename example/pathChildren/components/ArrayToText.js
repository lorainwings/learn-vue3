// 场景一: 老的是array, 新的是text
import { h, ref } from '../../../packages/vue/dist/v-next.esm.js'
const nextChildren = 'newChildren'
const prevChildren = [h('div', {}, 'A'), h('div', {}, 'B')]

export default {
  name: 'ArrayToText',
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
