import { HotTable } from '@handsontable/react-wrapper';
import { ContextMenu } from 'handsontable/plugins/contextMenu';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      id="hot"
      data={[
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]}
      colHeaders={true}
      height="auto"
      contextMenu={{
        items: {
          row_above: {
            name: 'Insert row above this one (custom name)',
          },
          row_below: {},
          separator: ContextMenu.SEPARATOR,
          clear_custom: {
            name: 'Clear all cells (custom)',
            callback() {
              this.clear();
            },
          },
        },
      }}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
