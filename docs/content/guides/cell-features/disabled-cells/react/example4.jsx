import { useRef, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  const hotRef = useRef(null);

  useEffect(() => {
    const hot = hotRef.current.hotInstance;

    hot.updateSettings({
      cells(row, col, prop) {
        const cellProperties = {};

        if (hot.getDataAtRowProp(row, prop) === 'Nissan') {
          cellProperties.editor = false;

        } else {
          cellProperties.editor = 'text';
        }

        return cellProperties;
      }
    });
  });

  return (
    <HotTable
      ref={hotRef}
      data={[
        { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
        { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
        { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
        { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' }
      ]}
      colHeaders={['Car', 'Year', 'Chassis color', 'Bumper color']}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example4'));
/* end:skip-in-preview */