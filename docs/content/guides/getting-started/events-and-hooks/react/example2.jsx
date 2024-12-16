import { useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef(null);
  let lastChange = null;

  useEffect(() => {
    const hot = hotRef.current?.hotInstance;

    hot?.updateSettings({
      beforeKeyDown(e) {
        const selection = hot?.getSelected()?.[0];

        if (!selection) return;
        console.log(selection);

        // BACKSPACE or DELETE
        if (e.keyCode === 8 || e.keyCode === 46) {
          e.stopImmediatePropagation();
          // remove data at cell, shift up
          hot.spliceCol(selection[1], selection[0], 1);
          e.preventDefault();
        }
        // ENTER
        else if (e.keyCode === 13) {
          // if last change affected a single cell and did not change it's values
          if (
            lastChange &&
            lastChange.length === 1 &&
            lastChange[0][2] == lastChange[0][3]
          ) {
            e.stopImmediatePropagation();
            hot.spliceCol(selection[1], selection[0], 0, '');
            // add new cell
            hot.selectCell(selection[0], selection[1]);
            // select new cell
          }
        }

        lastChange = null;
      },
    });
  });

  return (
    <HotTable
      data={[
        ['Tesla', 2017, 'black', 'black'],
        ['Nissan', 2018, 'blue', 'blue'],
        ['Chrysler', 2019, 'yellow', 'black'],
        ['Volvo', 2020, 'yellow', 'gray'],
      ]}
      colHeaders={true}
      rowHeaders={true}
      height="auto"
      minSpareRows={1}
      beforeChange={(changes, source) => {
        lastChange = changes;
      }}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      ref={hotRef}
    />
  );
};

export default ExampleComponent;
