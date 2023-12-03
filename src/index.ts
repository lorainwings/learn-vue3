export * from './runtime-dom'

import { baseCompile } from './compiler-core/src'
import * as runtimeDOM from './runtime-dom'
import { registerRuntimeCompiler } from './runtime-dom'

function compileToFunction(template) {
  const { code } = baseCompile(template)

  /**
   * baseCompile返回的code结果就是下面这样的字符串
   * 因此需要解决两个问题
   * 一是依赖的Vue, 也就是全文的runtime-dom所有的依赖
   * 二是最终的render函数也就是下面的return function render中的实际内容
   *
   * 因此可以使用new Function来实现这个目的
   */

  // const { toDisplayString: _toDisplayString, openBlock: _openBlock, createElementBlock: _createElementBlock } = Vue

  // return function render(_ctx, _cache, $props, $setup, $data, $options) {
  //   return (_openBlock(), _createElementBlock("div", null, "hi, " + _toDisplayString(_ctx.message), 1 /* TEXT */))
  // }

  const render = new Function('Vue', code)(runtimeDOM)
  return render
}

registerRuntimeCompiler(compileToFunction)
