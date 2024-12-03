import { HotTable, HotColumn } from '@handsontable/vue';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const CustomRenderer = {
  template: '<div><i style="color: #a9a9a9">Row: {{row}}, column: {{col}},</i> value: {{value}}</div>',
  data() {
    return {
      // We'll need to define properties in our data object,
      // corresponding to all of the data being injected from
      // the BaseEditorComponent class, which are:
      // - hotInstance (instance of Handsontable)
      // - row (row index)
      // - col (column index)
      // - prop (column property name)
      // - TD (the HTML cell element)
      // - cellProperties (the cellProperties object for the edited cell)
      hotInstance: null,
      TD: null,
      row: null,
      col: null,
      prop: null,
      value: null,
      cellProperties: null
    };
  }
};

const ExampleComponent = {
  data() {
    return {
      hotSettings: {
        data: [
          ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
          ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6', 'J6'],
          ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7', 'I7', 'J7'],
          ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8'],
          ['A9', 'B9', 'C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9', 'J9'],
        ],
        autoRowSize: false,
        autoColumnSize: false,
        height: 'auto',
        autoWrapRow: true,
        autoWrapCol: true,
        licenseKey: 'non-commercial-and-evaluation',
      }
    };
  },
  components: {
    HotTable,
    HotColumn,
    CustomRenderer
  }
};

export default ExampleComponent;
