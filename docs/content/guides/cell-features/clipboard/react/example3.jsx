import { useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  const hotRef = useRef(null);

  const copyBtnClickCallback = function() {
    document.execCommand('copy');
  };
  const cutBtnClickCallback = function() {
    document.execCommand('cut');
  };
  let copyBtnMousedownCallback;
  let cutBtnMousedownCallback;

  useEffect(() => {
    const hot = hotRef.current.hotInstance;

    copyBtnMousedownCallback = function() {
      hot.selectCell(1, 1);
    };
    cutBtnMousedownCallback = function() {
      hot.selectCell(1, 1);
    };
  });

  return (
    <>
      <HotTable
        ref={hotRef}
        rowHeaders={true}
        colHeaders={true}
        data={[
          ['A1', 'B1', 'C1', 'D1', 'E1'],
          ['A2', 'B2', 'C2', 'D2', 'E2'],
          ['A3', 'B3', 'C3', 'D3', 'E3'],
          ['A4', 'B4', 'C4', 'D4', 'E4'],
          ['A5', 'B5', 'C5', 'D5', 'E5'],
        ]}
        outsideClickDeselects={false}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="controls">
        <button
          id="copy"
          onMouseDown={(...args) => copyBtnMousedownCallback(...args)}
          onClick={(...args) => copyBtnClickCallback(...args)}
        >
          Select and copy cell B2
        </button>
        <button
          id="cut"
          onMouseDown={(...args) => cutBtnMousedownCallback(...args)}
          onClick={(...args) => cutBtnClickCallback(...args)}
        >
          Select and cut cell B2
        </button>
      </div>
    </>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example3'));
/* end:skip-in-preview */