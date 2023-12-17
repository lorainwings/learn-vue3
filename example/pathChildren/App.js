import { h } from '../../packages/vue/dist/v-next.esm.js'

import ArrayToText from './components/ArrayToText.js'
import TextToText from './components/TextToText.js'
import TextToArray from './components/TextToArray.js'
import ArrayToArray from './components/ArrayToArray.js'

export const App = {
  name: 'App',
  setup() {
    const onClick = () => {
      window.isChange.value = true
    }
    return { onClick }
  },
  render() {
    return h(
      'div',
      {
        id: 'root'
      },
      [
        h('h3', {}, '子元素节点更新流程demo'),
        h('button', { onClick: this.onClick }, '触发更新子节点更新'),

        // h(ArrayToText) // 老的是array, 新的是text

        // h(TextToText) // 老的是text, 新的是text

        // h(TextToArray) // 老的是text, 新的是array

        h(ArrayToArray) // 老的是array, 新的是array
      ]
    )
  }
}
