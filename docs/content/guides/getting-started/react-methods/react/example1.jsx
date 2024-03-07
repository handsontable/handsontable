import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  const data = [
    ['A1', 'B1', 'C1', 'D1'],
    ['A2', 'B2', 'C2', 'D2'],
    ['A3', 'B3', 'C3', 'D3'],
    ['A4', 'B4', 'C4', 'D4'],
  ];
  const hotTableComponentRef = useRef(null);

  const selectCell = () => {
    // The Handsontable instance is stored under the `hotInstance` property of the wrapper component.
    hotTableComponentRef.current.hotInstance.selectCell(1, 1);
  };

  return (
    <>
      <HotTable
        ref={hotTableComponentRef}
        data={data}
        colHeaders={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button onClick={selectCell}>Select cell B2</button>
      </div>
    </>
  );
}

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
/* end:skip-in-preview */