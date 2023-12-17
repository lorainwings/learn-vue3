// vue3
import App from './App.js'
import { createApp } from '../../packages/vue/dist/v-next.esm.js'

const rootContainer = document.querySelector('#app')
createApp(App).mount(rootContainer)
