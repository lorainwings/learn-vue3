import { h, ref, reactive } from '../../packages/vue/dist/v-next.esm.js'
export default {
  name: 'Child',
  setup(props, { emit }) {},
  render(proxy) {
    return h('div', {}, [h('div', {}, 'child-props-msg:' + this.$props.msg)])
  }
}
