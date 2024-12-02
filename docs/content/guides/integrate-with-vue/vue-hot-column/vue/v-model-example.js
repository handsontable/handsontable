import { HotTable, HotColumn } from '@handsontable/vue';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const CustomRenderer = {
  template: '<div v-bind:style="{ backgroundColor: bgColor }">{{value}}</div>',
  data() {
    return {
      hotInstance: null,
      TD: null,
      row: null,
      col: null,
      prop: null,
      value: null,
      cellProperties: null
    };
  },
  computed: {
    bgColor() {
      return this.$root.highlightedRows.includes(this.row) ? '#40b882' : 'transparent';
    }
  }
};

const ExampleComponent = {
  data() {
    return {
      hotSettings: {
        data: [
          ['A1'],
          ['A2'],
          ['A3'],
          ['A4'],
          ['A5'],
          ['A6'],
          ['A7'],
          ['A8'],
          ['A9'],
        ],
        licenseKey: 'non-commercial-and-evaluation',
        autoRowSize: false,
        autoColumnSize: false,
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
      },
      highlightedRows: ''
    };
  },
  components: {
    HotTable,
    HotColumn,
    CustomRenderer
  }
};

export default ExampleComponent;
