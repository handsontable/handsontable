import { useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef(null);

  useEffect(() => {
    const hot = hotRef.current?.hotInstance;

    hot?.validateCells();
  });

  return (
    <HotTable
      ref={hotRef}
      data={[
        ['Mercedes', 'A 160', 1332284400000, 6999.95],
        ['Citroen', 'C4 Coupe', '10 30', 8330],
        ['Audi', 'A4 Avant', '8:00 PM', 33900],
        ['Opel', 'Astra', 1332284400000, 7000],
        ['BMW', '320i Coupe', 1332284400000, 30500],
      ]}
      colHeaders={['Car', 'Model', 'Registration time', 'Price']}
      columnSorting={true}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      columns={[
        {
          type: 'text',
        },
        {
          // 2nd cell is simple text, no special options here
        },
        {
          type: 'time',
          timeFormat: 'h:mm:ss a',
          correctFormat: true,
        },
        {
          type: 'numeric',
          numericFormat: {
            pattern: '$ 0,0.00',
          },
        },
      ]}
    />
  );
};

export default ExampleComponent;
