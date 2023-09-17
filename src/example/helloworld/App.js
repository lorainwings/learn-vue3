export const App = {
  // .vue3
  // template
  render() {
    return h("div", `hi, ${this.msg}`)
  },
  setup() {
    // composition api
    return {
      msg: 'my-vue3'
    }
  }
}
