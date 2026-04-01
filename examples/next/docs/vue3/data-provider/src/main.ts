import './styles.css';

import { createApp } from 'vue';
import { registerAllModules } from 'handsontable/registry';

import App from './App.vue';

registerAllModules();

createApp(App).mount('#app');
