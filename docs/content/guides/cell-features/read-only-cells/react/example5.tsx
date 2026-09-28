import { useRef, useEffect } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
  { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
  { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
  { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' },
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
      colHeaders={['Car', 'Year', 'Chassis color', 'Bumper color']}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
