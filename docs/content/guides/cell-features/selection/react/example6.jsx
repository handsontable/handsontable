import { useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const [autoWrapRow, setAutoWrapRow] = useState(true);
  const [autoWrapCol, setAutoWrapCol] = useState(true);

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <label>
            <input type="checkbox" checked={autoWrapRow} onChange={(event) => setAutoWrapRow(event.target.checked)} />{' '}
            Wrap at the left/right edges (autoWrapRow)
          </label>
          <label>
            <input type="checkbox" checked={autoWrapCol} onChange={(event) => setAutoWrapCol(event.target.checked)} />{' '}
            Wrap at the top/bottom edges (autoWrapCol)
          </label>
        </div>
        <p>
          Select a cell, then press <kbd>Tab</kbd> or <kbd>&rarr;</kbd> at the end of a row, or <kbd>Enter</kbd> or{' '}
          <kbd>&darr;</kbd> at the bottom of a column, to see the effect.
        </p>
      </div>
      <HotTable
        ref={hotRef}
        data={[
          ['SKU-4821', 'Harbor Goods', 'Electronics', 142],
          ['SKU-0093', 'Alpine Supply Co.', 'Apparel', 67],
          ['SKU-2210', 'Harbor Goods', 'Electronics', 0],
          ['SKU-7734', 'Nordic Traders', 'Home Goods', 58],
          ['SKU-1145', 'Alpine Supply Co.', 'Apparel', 213],
        ]}
        colHeaders={['SKU', 'Supplier', 'Category', 'Quantity']}
        width="auto"
        height="auto"
        rowHeaders={true}
        autoWrapRow={autoWrapRow}
        autoWrapCol={autoWrapCol}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
