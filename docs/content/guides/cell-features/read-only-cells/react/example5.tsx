import { useRef, useEffect } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  { name: 'Hydrogen', symbol: 'H', atomicNumber: 1, atomicMass: 1.008 },
  { name: 'Helium', symbol: 'He', atomicNumber: 2, atomicMass: 4.003 },
  { name: 'Lithium', symbol: 'Li', atomicNumber: 3, atomicMass: 6.94 },
  { name: 'Beryllium', symbol: 'Be', atomicNumber: 4, atomicMass: 9.012 },
  { name: 'Boron', symbol: 'B', atomicNumber: 5, atomicMass: 10.81 },
];

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);

  useEffect(() => {
    const hot = hotRef.current?.hotInstance;

    hot?.updateSettings({
      cells(row) {
        return row === 1 ? { readOnly: true } : {};
      },
    });
  });

  return (
    <HotTable
      ref={hotRef}
      data={data}
      colHeaders={['Name', 'Symbol', 'Atomic number', 'Atomic mass']}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
