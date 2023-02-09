import { defineComponent } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css'

import { data } from '../constants';
import { progressBarRenderer } from '../renderers/progressBar';
import { starsRenderer } from '../renderers/stars';

import {
  alignHeaders,
  drawCheckboxInRowHeaders,
  addClassesToRows,
  changeCheckboxCell
} from '../hooks-callbacks';

// register Handsontable's modules
registerAllModules();

export default defineComponent({
  name: 'DataGrid',
  components: {
    HotTable,
    HotColumn
  },
  computed: {
    alignHeadersProp () {
      return alignHeaders;
    },

    addClassesToRowsProp() {
      return addClassesToRows;
    },

    drawCheckboxInRowHeadersProp() {
      return drawCheckboxInRowHeaders;
    },

    changeCheckboxCellProp() {
      return changeCheckboxCell;
    },

    dataProp() {
      return data;
    },

    starsRendererProp() {
      return starsRenderer;
    },

    progressBarRendererProp() {
      return progressBarRenderer;
    }
  }
});