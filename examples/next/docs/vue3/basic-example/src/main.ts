import { createApp } from 'vue'
import App from './App.vue'
import Handsontable from 'handsontable'
import { HotTable } from '@handsontable/vue3'

console.log(`Handsontable.version ${Handsontable.version}, HotTable.verddsion ${HotTable.version}`);

createApp(App).mount('#app')
