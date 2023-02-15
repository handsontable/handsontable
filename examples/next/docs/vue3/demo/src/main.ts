import Handsontable from 'handsontable';
import { HotTable } from "@handsontable/vue3";
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.mount('#app')

console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate}) Wrapper: v${HotTable.version} Vue: v3`);
