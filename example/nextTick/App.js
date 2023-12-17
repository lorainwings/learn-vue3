import {
  h,
  ref,
  getCurrentInstance,
  nextTick
} from '../../packages/vue/dist/v-next.esm.js'

export default {
  name: 'App',
  setup() {
    const count = ref(1)
    const instance = getCurrentInstance()
    async function onClick() {
      for (let i = 0; i < 100; i++) {
        // console.log(`update${i}`)
        count.value = i
      }
      console.log('isntance', instance)

      // nextTick(() => {
      //   console.log('nextTick', instance.vnode.el.innerHTML)
      // })

      nextTick().then(() => console.log(instance.vnode.el.innerHTML))

      // await nextTick()
      // console.log('await tick', instance.vnode.el.innerHTML)
    }
    return {
      onClick,
      count
    }
  },

  render() {
    const button = h(
      'button',
      { onClick: this.onClick },
      'click me batch update'
    )
    const p = h('p', {}, `count:${this.count}`)
    return h('div', {}, [button, p])
  }
}
