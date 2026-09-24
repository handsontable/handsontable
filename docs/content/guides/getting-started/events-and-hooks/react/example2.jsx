import { useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['Tesla', 2017, 'black', 'black'],
  ['Nissan', 2018, 'blue', 'blue'],
  ['Chrysler', 2019, 'yellow', 'black'],
  ['Volvo', 2020, 'yellow', 'gray'],
];

const ExampleComponent = () => {
  const hotRef = useRef(null);
  let lastChange = null;

  useEffect(() => {
    const hot = hotRef.current?.hotInstance;

    hot?.updateSettings({
      beforeKeyDown(e) {
        const selection = hot?.getSelected()?.[0];

        if (!selection) return;

        // Ignore header and corner selections (row or column index < 0)
        if (selection[0] < 0 || selection[1] < 0) return;

        console.log(selection);

        // BACKSPACE or DELETE
        if (e.keyCode === 8 || e.keyCode === 46) {
          // remove data at cell, shift the cells below it up
          const column = hot.getDataAtCol(selection[1]);
          const shiftedUp = column.slice(selection[0] + 1);
          shiftedUp.push(null);
          hot.populateFromArray(
            selection[0],
            selection[1],
            shiftedUp.map((value) => [value]),
          );
          e.preventDefault();
          lastChange = null;

          // block the default deletion behavior
          return false;
        }

        // ENTER
        if (e.keyCode === 13) {
          // if last change affected a single cell and did not change it's values
          if (lastChange && lastChange.length === 1 && lastChange[0][2] == lastChange[0][3]) {
            // insert an empty cell, shift the cells below it down
            const column = hot.getDataAtCol(selection[1]);
            const shiftedDown = ['', ...column.slice(selection[0])];
            hot.populateFromArray(
              selection[0],
              selection[1],
              shiftedDown.map((value) => [value]),
            );
            // add new cell
            hot.selectCell(selection[0], selection[1]);
            // select new cell
            lastChange = null;

            // block the default Enter behavior
            return false;
          }
        }

        lastChange = null;
      },
    });
  });

  return (
    <HotTable
      data={data}
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
