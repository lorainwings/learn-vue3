# Foo.vue编译模版结果对照

下面这段代码是原单文件组件

```vue
<script setup></script>

<template>
  <h1>Comp</h1>
  <slot></slot>
</template>
```

编译结果为:

```js
const __sfc__ = {}
import {
  createElementVNode as _createElementVNode,
  renderSlot as _renderSlot,
  Fragment as _Fragment,
  openBlock as _openBlock,
  createElementBlock as _createElementBlock
} from 'vue'

const _hoisted_1 = /*#__PURE__*/ _createElementVNode(
  'h1',
  null,
  'Comp',
  -1 /* HOISTED */
)
function render(_ctx, _cache) {
  return (
    _openBlock(),
    _createElementBlock(
      _Fragment,
      null,
      [_hoisted_1, _renderSlot(_ctx.$slots, 'default')],
      64 /* STABLE_FRAGMENT */
    )
  )
}
__sfc__.render = render
__sfc__.__file = 'src/Comp.vue'
export default __sfc__
```
