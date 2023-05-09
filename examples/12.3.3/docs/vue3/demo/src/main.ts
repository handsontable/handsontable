import { createApp, h, version } from "vue";
import App from "./App.vue";
import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/vue3';

console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate}) Wrapper: v${HotTable.version} Vue: v${version}`);

// Vue.config.silent = true;

createApp({
  render: () => h(App)
}).mount("#app");
