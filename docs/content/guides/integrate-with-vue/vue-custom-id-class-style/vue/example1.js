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
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        stretchH: 'all',
        autoWrapRow: true,
        autoWrapCol: true,
        licenseKey: 'non-commercial-and-evaluation'
      },
      id: 'my-custom-id',
      className: 'my-custom-classname',
      style: 'height: 142px; overflow: hidden; border: 1px solid red;'
    };
  },
  components: {
    HotTable
  }
};

export default ExampleComponent;
