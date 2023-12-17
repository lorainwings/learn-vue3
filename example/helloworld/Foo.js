import { h } from '../../packages/vue/dist/v-next.esm.js'

// 功能一 实现setup函数中可以访问props变量
// 功能二 实现在模版中正确解析props中的响应式变量
// 功能三 实现props是只读属性
export const Foo = {
  name: 'Foo',
  setup(props) {
    // props.count
    console.log(props)
    // readonly
    props.count++
    console.log('props', props)
  },
  render() {
    return h('div', {}, 'foo:' + this.count)
  }
}
