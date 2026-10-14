import { useCallback, useState } from 'react';
import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['Stainless Steel Water Bottle', 24.5, 24.5],
  ['Wireless Mouse', 18, 18],
  ['USB-C Charging Cable', 9.9, 9.9],
  ['Desk Lamp', 32, 32],
  ['Notebook A5', 4.75, 4.75],
];

const colHeaders = ['Product', 'Default', 'preserveNumericLiteral: true'];

const ExampleComponent = () => {
  const [readout, setReadout] = useState(
    'Edit a cell in the Default or preserveNumericLiteral column to see the stored value.',
  );

  const afterChange = useCallback(function (changes, source) {
    if (source === 'loadData' || !changes) {
      return;
    }

    const [row, prop] = changes[changes.length - 1];
    const column = prop;
    const value = this.getDataAtCell(row, column);
    const label = column === 1 ? 'Default' : 'preserveNumericLiteral';

    setReadout(`${label} stores: ${JSON.stringify(value)} (${typeof value})`);
  }, []);

  return (
    <>
      <HotTable
        data={data}
        colHeaders={colHeaders}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        afterChange={afterChange}
        licenseKey="non-commercial-and-evaluation"
      >
        <HotColumn type="text" readOnly={true} width={240} />
        <HotColumn type="numeric" />
        <HotColumn type="numeric" preserveNumericLiteral={true} />
      </HotTable>
      <p id="example2-readout" aria-live="polite">
        {readout}
      </p>
    </>
  );
};

export default ExampleComponent;
