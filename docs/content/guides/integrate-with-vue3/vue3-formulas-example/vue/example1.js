import { defineComponent, markRaw } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

// mark the HyperFormula instance as raw to avoid Vue from proxying it
const hfRaw = markRaw(
  HyperFormula.buildEmpty({
    licenseKey: 'internal-use-in-handsontable',
  })
);

const ExampleComponent = defineComponent({
  data() {
    return {
      hotSettings: {
        themeName: 'ht-theme-main',
        data: [
          ['4', '=IF(A1>4, "TRUE", "FALSE")', 'C1'],
          ['2', 'B2', '=A1+A2'],
          ['3', 'B3', 'C3'],
          ['4', 'B4', 'C4'],
          ['5', 'B5', 'C5'],
          ['6', 'B6', 'C6'],
        ],
        colHeaders: true,
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
        licenseKey: 'non-commercial-and-evaluation',
        formulas: {
          engine: hfRaw,
        },
      },
    };
  },
  components: {
    HotTable,
  },
});

export default ExampleComponent;
