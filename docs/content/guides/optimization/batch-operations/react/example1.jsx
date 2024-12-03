import { useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const [counter, setCounter] = useState(0);
  const [output, setOutput] = useState('');
  const data2 = [[11, 'Gavin Elle', 'Floppy socks', 'XS', 3, 'yes']];
  const data3 = [
    [12, 'Gary Erre', 'Happy dress', 'M', 1, 'no'],
    [13, 'Anna Moon', 'Unicorn shades', 'uni', 200, 'no'],
    [14, 'Elise Eli', 'Regular shades', 'uni', 1, 'no'],
  ];

  const logOutput = (msg) => {
    setCounter(counter + 1);
    setOutput(`[${counter}] ${msg}\n${output}`);
  };

  const alterTable = () => {
    const hot = hotRef.current?.hotInstance;

    hot?.alter('insert_row_above', 10, 10);
    hot?.alter('insert_col_start', 6, 1);
    hot?.populateFromArray(10, 0, data2);
    hot?.populateFromArray(11, 0, data3);
    hot?.setCellMeta(2, 2, 'className', 'green-bg');
    hot?.setCellMeta(4, 2, 'className', 'green-bg');
    hot?.setCellMeta(5, 2, 'className', 'green-bg');
    hot?.setCellMeta(6, 2, 'className', 'green-bg');
    hot?.setCellMeta(8, 2, 'className', 'green-bg');
    hot?.setCellMeta(9, 2, 'className', 'green-bg');
    hot?.setCellMeta(10, 2, 'className', 'green-bg');
    hot?.alter('remove_col', 6, 1);
    hot?.alter('remove_row', 10, 10);
    hot?.setCellMeta(0, 5, 'className', 'red-bg');
    hot?.setCellMeta(10, 5, 'className', 'red-bg');
    hot?.render(); // Render is needed here to populate the new "className"s
  };

  const buttonWithoutClickCallback = () => {
    const t1 = performance.now();

    alterTable();

    const t2 = performance.now();

    logOutput(`Time without batch ${(t2 - t1).toFixed(2)}ms`);
  };

  const buttonWithClickCallback = () => {
    const hot = hotRef.current?.hotInstance;
    const t1 = performance.now();

    hot?.batch(alterTable);

    const t2 = performance.now();

    logOutput(`Time with batch ${(t2 - t1).toFixed(2)}ms`);
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button
            id="buttonWithout"
            className="button button--primary"
            onClick={() => buttonWithoutClickCallback()}
          >
            Run without batch method
          </button>
          <button
            id="buttonWith"
            className="button button--primary"
            onClick={() => buttonWithClickCallback()}
          >
            Run with batch method
          </button>
        </div>
        <output className="console" id="output">
          {output || 'Here you will see the log'}
        </output>
      </div>
      <HotTable
        ref={hotRef}
        data={[
          [1, 'Gary Nash', 'Speckled trousers', 'S', 1, 'yes'],
          [2, 'Gloria Brown', '100% Stainless sweater', 'M', 2, 'no'],
          [3, 'Ronald Carver', 'Sunny T-shirt', 'S', 1, 'no'],
          [4, 'Samuel Watkins', 'Floppy socks', 'S', 3, 'no'],
          [5, 'Stephanie Huddart', 'Bushy-bush cap', 'XXL', 1, 'no'],
          [6, 'Madeline McGillivray', 'Long skirt', 'L', 1, 'no'],
          [7, 'Jai Moor', 'Happy dress', 'XS', 1, 'no'],
          [8, 'Ben Lower', 'Speckled trousers', 'M', 1, 'no'],
          [9, 'Ali Tunbridge', 'Speckled trousers', 'M', 2, 'no'],
          [10, 'Archie Galvin', 'Regular shades', 'uni', 10, 'no'],
        ]}
        width="auto"
        height="auto"
        colHeaders={[
          'ID',
          'Customer name',
          'Product name',
          'Size',
          'qty',
          'Return',
        ]}
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
