import Vue from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue';
import Handsontable from 'handsontable/base';

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
      return this.$root.highlightedRows.includes(this.row) ? '#40b882' : '#fff';
    }
  }
};

const App = new Vue({
  el: '#v-model-example',
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
});
