import { useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const data: string[][] = [
    ['A1', 'B1', 'C1', 'D1'],
    ['A2', 'B2', 'C2', 'D2'],
    ['A3', 'B3', 'C3', 'D3'],
    ['A4', 'B4', 'C4', 'D4'],
  ];

  const hotTableComponentRef = useRef<HotTableRef>(null);

  const selectCell = () => {
    // The Handsontable instance is stored under the `hotInstance` property of the wrapper component.
    hotTableComponentRef.current?.hotInstance?.selectCell(1, 1);
  };

  return (
    <>
      <div className="controls">
        <button onClick={selectCell}>Select cell B2</button>
      </div>
      <HotTable
        ref={hotTableComponentRef}
        data={data}
        colHeaders={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
