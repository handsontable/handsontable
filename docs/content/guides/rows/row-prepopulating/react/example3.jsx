import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef(null);

  const templateValues = ['one', 'two', 'three'];
  const data = [
    ['Hydrogen', 'H', 1, 1.008, 7],
    ['Helium', 'He', 2, 4.003, 9],
    ['Lithium', 'Li', 3, 6.94, 9],
    ['Beryllium', 'Be', 4, 9.012, 11],
    ['Boron', 'B', 5, 10.81, 15],
  ];

  function isEmptyRow(instance, row) {
    const rowData = instance.getDataAtRow(row);

    for (let i = 0, ilen = rowData.length; i < ilen; i++) {
      if (rowData[i] !== null) {
        return false;
      }
    }

    return true;
  }

  function defaultValueRenderer(instance, td, row, col) {
    const args = arguments;

    if (args[5] === null && isEmptyRow(instance, row)) {
      args[5] = templateValues[col];
      td.style.color = '#999';
    } else {
      td.style.color = '';
    }

    textRenderer.apply(this, args);
  }

  return (
    <>
      <HotTable
        ref={hotRef}
        data={data}
        startRows={8}
        startCols={5}
        colHeaders={['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes']}
        minSpareRows={1}
        contextMenu={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
        cells={function (row, col, prop) {
          const cellProperties = {};

          cellProperties.renderer = defaultValueRenderer;

          return cellProperties;
        }}
        beforeChange={function (changes) {
          const instance = hotRef.current?.hotInstance;
          const columns = instance?.countCols() || 0;
          const rowColumnSeen = {};
          const rowsToFill = {};

          for (let i = 0; i < changes.length; i++) {
            const cellChanges = changes;

            // if oldVal is empty
            if (cellChanges[i][2] === null && cellChanges[i][3] !== null) {
              if (isEmptyRow(instance, cellChanges[i][0])) {
                // add this row/col combination to the cache so it will not be overwritten by the template
                rowColumnSeen[`${cellChanges[i][0]}/${cellChanges[i][1]}`] = true;
                rowsToFill[cellChanges[i][0]] = true;
              }
            }
          }

          for (const r in rowsToFill) {
            if (rowsToFill.hasOwnProperty(r)) {
              for (let c = 0; c < columns; c++) {
                // if it is not provided by user in this change set, take the value from the template
                if (!rowColumnSeen[`${r}/${c}`]) {
                  changes.push([r, c, null, templateValues[c]]);
                }
              }
            }
          }
        }}
      />
    </>
  );
};

export default ExampleComponent;
