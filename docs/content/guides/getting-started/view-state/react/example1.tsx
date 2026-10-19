import { useRef, useState } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['Laptop Pro 14', 'Computers', 1499, 24, 4.7],
  ['Wireless Mouse', 'Accessories', 29, 310, 4.4],
  ['Mechanical Keyboard', 'Accessories', 119, 85, 4.8],
  ['4K Monitor 27"', 'Displays', 449, 41, 4.6],
  ['USB-C Dock', 'Accessories', 189, 67, 4.2],
  ['Tablet Air 11', 'Computers', 599, 52, 4.5],
  ['Webcam HD', 'Accessories', 79, 140, 4.1],
  ['Ultrawide Monitor 34"', 'Displays', 799, 18, 4.9],
];

const ExampleComponent: React.FC = () => {
  const hotRef = useRef<HotTableRef>(null);
  // The saved view is plain JSON, so you can keep it in state, `localStorage`, or on a server.
  const savedView = useRef<string | null>(null);
  const [output, setOutput] = useState<string>('Sort, filter, hide, or resize columns, then click "Save view"');

  const saveClickCallback = () => {
    const hot = hotRef.current!.hotInstance!;

    savedView.current = JSON.stringify(hot.getPlugin('viewState').getViewState());
    setOutput('View saved');
  };

  const restoreClickCallback = () => {
    const hot = hotRef.current!.hotInstance!;

    if (savedView.current === null) {
      setOutput('Save a view first');

      return;
    }

    const { skipped } = hot.getPlugin('viewState').setViewState(JSON.parse(savedView.current));

    setOutput(
      skipped.length === 0
        ? 'View restored'
        : `View restored, skipped: ${skipped.map(({ part, reason }) => `${part} (${reason})`).join(', ')}`
    );
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button id="save" className="button button--primary button--blue" onClick={saveClickCallback}>
            Save view
          </button>
          <button id="restore" className="button button--primary button--blue" onClick={restoreClickCallback}>
            Restore view
          </button>
        </div>
        <output className="console" id="output">
          {output}
        </output>
      </div>
      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={['Product', 'Category', 'Price', 'Stock', 'Rating']}
        rowHeaders={true}
        columnSorting={true}
        filters={true}
        dropdownMenu={true}
        contextMenu={true}
        hiddenColumns={{ indicators: true }}
        manualColumnResize={true}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
