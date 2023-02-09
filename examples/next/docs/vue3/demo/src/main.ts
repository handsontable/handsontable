import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/vue3';
import { createApp } from 'vue'
import App from './App.vue'

console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate}) Wrapper: v${HotTable.version} Vue: 3`);

createApp(App).mount('#app');
