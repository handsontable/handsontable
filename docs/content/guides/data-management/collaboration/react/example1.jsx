import { useEffect, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

// marks a change as coming from another collaborator, so it isn't broadcast again
const REMOTE_SOURCE = 'remotePeer';

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const [statusText, setStatusText] = useState('A remote update to the first row arrives in 3 seconds.');

  const applyRemoteChange = (row, column, value) => {
    const hot = hotRef.current?.hotInstance;
    const editor = hot?.getActiveEditor();
    const editingSameCell = editor?.isOpened() && editor.row === row && editor.col === column;

    if (editingSameCell) {
      // don't overwrite a cell the local user is editing right now -
      // check again shortly, and apply the change once the local edit finishes
      setTimeout(() => applyRemoteChange(row, column, value), 300);

      return;
    }

    hot?.setDataAtCell(row, column, value, REMOTE_SOURCE);
    setStatusText('A collaborator marked "Update onboarding flow" as Done.');
  };

  useEffect(() => {
    // simulate an update coming from another collaborator - start editing the Status
    // cell in the first row before the timeout fires to see the update wait for you
    const timeoutId = setTimeout(() => applyRemoteChange(0, 2, 'Done'), 3000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      <div className="example-controls-container">
        <p className="controls">{statusText}</p>
      </div>
      <HotTable
        ref={hotRef}
        data={[
          ['Update onboarding flow', 'Ana García', 'In progress'],
          ['Fix invoice rounding bug', 'James Okafor', 'Blocked'],
          ['Write Q3 release notes', 'Li Wei', 'In progress'],
          ['Migrate auth service', 'Sofia Rossi', 'Done'],
          ['Design empty states', 'Diego Fernández', 'In progress'],
        ]}
        colHeaders={['Task', 'Assignee', 'Status']}
        rowHeaders={true}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
        beforeChange={(changes, source) => {
          if (source === REMOTE_SOURCE || !changes) {
            return;
          }

          changes.forEach(([row, column, , newValue]) => {
            // send the local edit to your collaboration backend here
            console.log('Broadcasting local edit:', row, column, newValue);
          });
        }}
      />
    </>
  );
};

export default ExampleComponent;
