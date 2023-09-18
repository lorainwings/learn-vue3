import { h } from "../../lib/vue-next.esm.js"

export const App = {
  // .vue3
  // template
  render() {
    return h(
      "div",
      { id: 'root', class: ['red', 'hard'] },
      // `hi, ${this.msg}`
      [h("p", { class: 'red' }, 'hello'), h("p", { class: 'blue' }, 'my-vue3')]
    )
  },
  setup() {
    // composition api
    return {
      msg: 'my-vue3'
    }
  }
}
