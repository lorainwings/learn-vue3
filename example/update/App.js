import { h, ref } from '../../packages/vue/dist/v-next.esm.js'

export const App = {
  name: 'App',
  setup() {
    const count = ref(0)

    const onClick = () => count.value++

    const props = ref({
      foo: 'foo',
      bar: 'bar'
    })

    // foo之前的值和新的值不一样, 需要修改foo属性
    const onChangePropsDemo1 = () => {
      props.value.foo = 'new - foo'
    }

    // 新属性变为null 或者 undefined, 需要删除foo属性
    const onChangePropsDemo2 = () => {
      props.value.foo = undefined
    }

    // bar 属性在新的 props 中没有了, 需要删除bar属性
    const onChangePropsDemo3 = () => {
      props.value = {
        foo: 'foo'
      }
    }

    return {
      count,
      props,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3
    }
  },
  render() {
    // this.count 需要自动拆包
    return h(
      'div',
      {
        id: 'root',
        ...this.props
      },
      [
        h('div', {}, 'count:' + this.count),
        h('button', { onClick: this.onClick }, 'Click'),
        h('button', { onClick: this.onChangePropsDemo1 }, 'ChangeProps1 修改'),
        h('button', { onClick: this.onChangePropsDemo2 }, 'ChangeProps2 删除'),
        h('button', { onClick: this.onChangePropsDemo3 }, 'ChangeProps3 删除')
      ]
    )
  }
}
