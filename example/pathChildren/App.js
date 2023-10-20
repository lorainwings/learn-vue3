import { h } from '../../lib/vue-next.esm.js'

import ArrayToText from './components/ArrayToText.js'
import TextToText from './components/TextToText.js'
import TextToArray from './components/TextToArray.js'
import ArrayToArray from './components/ArrayToArray.js'

export const App = {
  name: 'App',
  setup() {},
  render() {
    return h(
      'div',
      {
        id: 'root'
      },
      [
        h('p', {}, '主页'),

        // h(ArrayToText) // 老的是array, 新的是text

        // h(TextToText) // 老的是text, 新的是text

        // h(TextToArray) // 老的是text, 新的是array

        h(ArrayToArray) // 老的是array, 新的是array
      ]
    )
  }
}
