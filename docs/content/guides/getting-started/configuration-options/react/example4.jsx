import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const data = [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
  ];

  return (
    <HotTable
      data={data}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      width="auto"
      height="auto"
      rowHeaders={true}
      colHeaders={true}
      readOnly={false}
      cell={[
        {
          // bottom-level cell options overwrite the top-level grid options
          // apply only to a cell with coordinates (0, 0)
          row: 0,
          col: 0,
          readOnly: true,
        },
        {
          // bottom-level cell options overwrite the top-level grid options
          // apply only to a cell with coordinates (1, 1)
          row: 1,
          col: 1,
          readOnly: true,
        },
      ]}
    />
  );
};

export default ExampleComponent;
