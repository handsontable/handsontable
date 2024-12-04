import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3'],
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4'],
        ['A5', 'B5', 'C5', 'D5', 'E5', 'F5'],
      ]}
      rowHeaders={true}
      colHeaders={true}
      stretchH="all"
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      customBorders={[
        {
          range: {
            from: {
              row: 1,
              col: 1,
            },
            to: {
              row: 3,
              col: 4,
            },
          },
          top: {
            width: 2,
            color: '#5292F7',
          },
          bottom: {
            width: 2,
            color: 'red',
          },
          start: {
            width: 2,
            color: 'orange',
          },
          end: {
            width: 2,
            color: 'magenta',
          },
        },
        {
          row: 2,
          col: 2,
          start: {
            width: 2,
            color: 'red',
          },
          end: {
            width: 1,
            color: 'green',
          },
        },
      ]}
    />
  );
};

export default ExampleComponent;
