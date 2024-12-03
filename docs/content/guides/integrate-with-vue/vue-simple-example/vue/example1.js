import { HotTable } from '@handsontable/vue';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = {
  data() {
    return {
      hotSettings: {
        data: [
          ['', 'Ford', 'Volvo', 'Toyota', 'Honda'],
          ['2016', 10, 11, 12, 13],
          ['2017', 20, 11, 14, 13],
          ['2018', 30, 15, 12, 13]
        ],
        colHeaders: true,
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
        licenseKey: 'non-commercial-and-evaluation'
      }
    };
  },
  components: {
    HotTable
  }
};

export default ExampleComponent;