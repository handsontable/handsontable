import { defineComponent } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';

/* start:skip-in-preview */
import { createApp } from 'vue';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = defineComponent({
  data() {
    return {
      hotSettings: {
        data: [
          ['A1', 'B1'],
          ['A2', 'B2'],
          ['A3', 'B3'],
          ['A4', 'B4'],
          ['A5', 'B5'],
          ['A6', 'B6'],
          ['A7', 'B7'],
          ['A8', 'B8'],
          ['A9', 'B9'],
          ['A10', 'B10'],
        ],
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
        licenseKey: 'non-commercial-and-evaluation',
      },
      secondColumnSettings: {
        title: 'Second column header',
      },
    };
  },
  components: {
    HotTable,
    HotColumn,
  }
});

export default ExampleComponent;

const app = createApp(ExampleComponent);

app.mount('#example1');
/* end:skip-in-preview */