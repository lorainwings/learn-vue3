// vue3
import App from './App.js'
import { createApp } from '../../lib/vue-next.esm.js'

const rootContainer = document.querySelector('#app')
createApp(App).mount(rootContainer)
