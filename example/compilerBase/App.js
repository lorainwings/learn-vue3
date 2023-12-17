import { ref } from '../../packages/vue/dist/v-next.esm.js'

export const App = {
  name: 'App',
  template: '<div>hi, {{message}}</div>',
  setup() {
    const message = (window.message = ref('hello world'))
    return {
      message
    }
  }
}
