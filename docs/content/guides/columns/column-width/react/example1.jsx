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
        [
          'A1',
          'B1',
          'C1',
          'D1',
          'E1',
          'F1',
          'G1',
          'H1',
          'I1',
          'J1',
          'K1',
          'L1',
          'M1',
          'N1',
          'O1',
        ],
        [
          'A2',
          'B2',
          'C2',
          'D2',
          'E2',
          'F2',
          'G2',
          'H2',
          'I2',
          'J2',
          'K2',
          'L2',
          'M2',
          'N2',
          'O2',
        ],
        [
          'A3',
          'B3',
          'C3',
          'D3',
          'E3',
          'F3',
          'G3',
          'H3',
          'I3',
          'J3',
          'K3',
          'L3',
          'M3',
          'N3',
          'O3',
        ],
        [
          'A4',
          'B4',
          'C4',
          'D4',
          'E4',
          'F4',
          'G4',
          'H4',
          'I4',
          'J4',
          'K4',
          'L4',
          'M4',
          'N4',
          'O4',
        ],
        [
          'A5',
          'B5',
          'C5',
          'D5',
          'E5',
          'F5',
          'G5',
          'H5',
          'I5',
          'J5',
          'K5',
          'L5',
          'M5',
          'N5',
          'O5',
        ],
      ]}
      width="100%"
      height="auto"
      colHeaders={true}
      rowHeaders={true}
      colWidths={100}
      manualColumnResize={true}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
