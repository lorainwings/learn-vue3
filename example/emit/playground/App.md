# App.vue编译结果对照

下面这段代码是原单文件组件

```vue
<script setup>
import Comp from './Comp.vue'

const handleAdd = () => console.log('handleAdd')
</script>

<template>
  <h1>App</h1>
  <Comp @add="handleAdd"></Comp>
</template>
```

编译结果为:

```js
/* Analyzed bindings: {
  "Comp": "setup-const",
  "handleAdd": "setup-const"
} */
import {
  createElementVNode as _createElementVNode,
  createVNode as _createVNode,
  Fragment as _Fragment,
  openBlock as _openBlock,
  createElementBlock as _createElementBlock
} from 'vue'

const _hoisted_1 = /*#__PURE__*/ _createElementVNode(
  'h1',
  null,
  'App',
  -1 /* HOISTED */
)

import Comp from './Comp.vue'

const __sfc__ = {
  __name: 'App',
  setup(__props) {
    const handleAdd = () => console.log('handleAdd')

    return (_ctx, _cache) => {
      return (
        _openBlock(),
        _createElementBlock(
          _Fragment,
          null,
          [_hoisted_1, _createVNode(Comp, { onAdd: handleAdd })],
          64 /* STABLE_FRAGMENT */
        )
      )
    }
  }
}
__sfc__.__file = 'src/App.vue'
export default __sfc__
```
