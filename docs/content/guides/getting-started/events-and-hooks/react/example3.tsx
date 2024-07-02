import { useState, ChangeEvent } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const [settings, setSettings] = useState(() => {
    const initialState = {
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
      autoWrapRow: true,
      autoWrapCol: true,
      height: 220,
      licenseKey: 'non-commercial-and-evaluation',
    };

    return initialState;
  });

  const handleChange =
    (setting: string, states: number[] | boolean[]) => (event: ChangeEvent) => {
      setSettings((prevState) => ({
        ...prevState,
        [setting]: states[(event.target as HTMLInputElement).checked ? 1 : 0],
      }));
    };

  return (
    <div>
      <div className="controls">
        <label>
          <input
            onChange={handleChange('fixedRowsTop', [0, 2])}
            type="checkbox"
          />
          Add fixed rows
        </label>
        <br />

        <label>
          <input
            onChange={handleChange('fixedColumnsStart', [0, 2])}
            type="checkbox"
          />
          Add fixed columns
        </label>
        <br />

        <label>
          <input
            onChange={handleChange('rowHeaders', [false, true])}
            type="checkbox"
          />
          Enable row headers
        </label>
        <br />

        <label>
          <input
            onChange={handleChange('colHeaders', [false, true])}
            type="checkbox"
          />
          Enable column headers
        </label>
        <br />
      </div>

      <HotTable id="hot" {...settings} />
    </div>
  );
};

export default ExampleComponent;
