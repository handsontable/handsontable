import { defineComponent } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = defineComponent({
  data() {
    return {
      hotData: [
        { id: 1, name: 'Table tennis racket', payment: { price: 13, currency: 'PLN' } },
        { id: 2, name: 'Outdoor game ball', payment: { price: 14, currency: 'USD' } },
        { id: 3, name: 'Mountain bike', payment: { price: 300, currency: 'USD' } }
      ],
      secondColumnSettings: {
        title: 'Second column header'
      },
      settings: {
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
        licenseKey: 'non-commercial-and-evaluation'
      },
    };
  },
  components: {
    HotTable,
    HotColumn,
  }
});

export default ExampleComponent;
