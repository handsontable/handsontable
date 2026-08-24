import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef(null);

  const throwErrors = () => {
    hotRef.current?.hotInstance?.updateSettings({
      columnSummary: [
        {
          type: 'sum',
          destinationRow: 0,
          destinationColumn: 0,
          reversedRowCoords: true,
          suppressDataTypeErrors: false,
        },
        {
          type: 'sum',
          destinationRow: 0,
          destinationColumn: 1,
          reversedRowCoords: true,
          suppressDataTypeErrors: false,
        },
      ],
    });
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button className="button button--primary" onClick={throwErrors}>
            Throw data type errors
          </button>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
        data={[[0, 1, 2], ['3c', '4b', 5], [], []]}
        colHeaders={true}
        rowHeaders={true}
        columnSummary={[
          {
            type: 'sum',
            destinationRow: 0,
            destinationColumn: 0,
            reversedRowCoords: true,
          },
          {
            type: 'sum',
            destinationRow: 0,
            destinationColumn: 1,
            reversedRowCoords: true,
          },
        ]}
        height="auto"
      />
    </>
  );
};

export default ExampleComponent;
