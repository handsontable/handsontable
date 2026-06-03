import { defineComponent } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = defineComponent({
  data() {
    return {
      formatJP: {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 2,
      },
      formatTR: {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
      },
      hotData: [
        {
          productName: 'Product A',
          JP_price: 1.32,
          TR_price: 100.56,
        },
        {
          productName: 'Product B',
          JP_price: 2.22,
          TR_price: 453.5,
        },
        {
          productName: 'Product C',
          JP_price: 3.1,
          TR_price: 678.1,
        },
      ],
      settings: {
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
        locale: 'en-US',
        licenseKey: 'non-commercial-and-evaluation'
      }
    };
  },
  components: {
    HotTable,
    HotColumn,
  }
});

export default ExampleComponent;
