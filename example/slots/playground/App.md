# App.vue编译Slots结果对照

下面这段代码是原单文件组件

```vue
<script setup>
import Comp from './Comp.vue'
</script>

<template>
  <h1>App</h1>
  <Comp>
    <div>这是一段slots</div>
  </Comp>
</template>
```

编译结果为:

```js
/* Analyzed bindings: {
  "Comp": "setup-const"
} */
import {
  createElementVNode as _createElementVNode,
  withCtx as _withCtx,
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
const _hoisted_2 = /*#__PURE__*/ _createElementVNode(
  'div',
  null,
  '这是一段slots',
  -1 /* HOISTED */
)

import Comp from './Comp.vue'

const __sfc__ = {
  __name: 'App',
  setup(__props) {
    return (_ctx, _cache) => {
      return (
        _openBlock(),
        _createElementBlock(
          _Fragment,
          null,
          [
            _hoisted_1,
            _createVNode(Comp, null, {
              default: _withCtx(() => [_hoisted_2]),
              _: 1 /* STABLE */
            })
          ],
          64 /* STABLE_FRAGMENT */
        )
      )
    }
  }
}
__sfc__.__file = 'src/App.vue'
export default __sfc__
```
