import { useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);

  const mergeNoteRow = () => {
    hotRef.current?.hotInstance?.getPlugin('mergeCells').merge(5, 0, 5, 3);
  };

  const unmergeNoteRow = () => {
    hotRef.current?.hotInstance?.getPlugin('mergeCells').unmerge(5, 0, 5, 3);
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button id="example4-merge" className="button button--primary" onClick={mergeNoteRow}>
            Merge the note row
          </button>
          <button id="example4-unmerge" className="button button--primary" onClick={unmergeNoteRow}>
            Unmerge the note row
          </button>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={[
          ['North America', 420000, 465000, 501000],
          ['Europe', 388000, 402000, 411000],
          ['APAC', 275000, 298000, 312000],
          ['Latin America', 142000, 151000, 158000],
          ['Middle East', 96000, 101000, 108000],
          ['Note: Q1 totals include a one-time currency adjustment.', null, null, null],
        ]}
        colHeaders={['Region', 'Jan 2025', 'Feb 2025', 'Mar 2025']}
        rowHeaders={true}
        height="auto"
        contextMenu={true}
        mergeCells={true}
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
