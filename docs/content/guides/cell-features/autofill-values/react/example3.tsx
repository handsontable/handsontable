import { useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

// Defined outside the component so autofill can mutate this array in place
// without a re-render (triggered by `setOutput`) resetting it to its initial values.
const data = [
  ['Hydrogen', 'H', 1, 1.008, 7],
  ['Helium', 'He', 2, 4.003, 9],
  ['Lithium', 'Li', 3, 6.94, 9],
  ['Beryllium', '', '', '', ''],
  ['Boron', '', '', '', ''],
];

const ExampleComponent = () => {
  const [output, setOutput] = useState('Drag the fill handle to see the affected range logged here.');

  return (
    <>
      <output className="console" id="output">
        {output}
      </output>
      <HotTable
        data={data}
        rowHeaders={true}
        colHeaders={['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes']}
        colWidths={[80, 62, 110, 118, 110]}
        stretchH="all"
        fillHandle={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
        beforeAutofill={(selectionData) =>
          // Round every filled number up to the nearest multiple of 5.
          selectionData.map((row) => row.map((value) => (typeof value === 'number' ? Math.ceil(value / 5) * 5 : value)))
        }
        afterAutofill={(fillData, sourceRange, targetRange, direction) => {
          setOutput(
            `Filled rows ${targetRange.from.row}-${targetRange.to.row}, ` +
              `columns ${targetRange.from.col}-${targetRange.to.col} (direction: "${direction}").`
          );
        }}
      />
    </>
  );
};

export default ExampleComponent;
