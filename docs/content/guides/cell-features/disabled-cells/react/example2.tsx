import { useRef, useEffect } from 'react';
import Handsontable from 'handsontable';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);

  useEffect(() => {
    const hot = hotRef.current?.hotInstance;

    hot?.updateSettings({
      cells(row, col) {
        const cellProperties: Handsontable.CellMeta = {};

        if (hot.getData()[row][col] === 'Nissan') {
          cellProperties.readOnly = true;
        }

        return cellProperties;
      },
    });
  });

  return (
    <HotTable
      ref={hotRef}
      data={[
        { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
        { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
        { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
        { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' },
      ]}
      colHeaders={['Car', 'Year', 'Chassis color', 'Bumper color']}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
