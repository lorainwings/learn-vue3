# Foo.vue编译结果对照

下面这段代码是原单文件组件

```vue
<script setup>
const emit = defineEmits(['add'])

const sendEmit = () => {
  console.log('sendEmit')
  emit('add', '------------------------')
}
</script>

<template>
  <h1>Comp</h1>
  <button @click="sendEmit">发送Emit</button>
</template>
```

编译结果为:

```js
/* Analyzed bindings: {
  "emit": "setup-const",
  "sendEmit": "setup-const"
} */
import {
  createElementVNode as _createElementVNode,
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

const __sfc__ = {
  __name: 'Comp',
  emits: ['add'],
  setup(__props, { emit: __emit }) {
    const emit = __emit

    const sendEmit = () => {
      console.log('sendEmit')
      emit('add', '------------------------')
    }

    return (_ctx, _cache) => {
      return (
        _openBlock(),
        _createElementBlock(
          _Fragment,
          null,
          [
            _hoisted_1,
            _createElementVNode('button', { onClick: sendEmit }, '发送Emit')
          ],
          64 /* STABLE_FRAGMENT */
        )
      )
    }
  }
}
__sfc__.__file = 'src/Comp.vue'
export default __sfc__
```
