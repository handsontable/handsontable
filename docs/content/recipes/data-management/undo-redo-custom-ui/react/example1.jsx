import { useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/* start:skip-in-preview */
const data = [
  { id: 1, task: 'Write release notes', status: 'Done', owner: 'Mia' },
  { id: 2, task: 'Update API docs', status: 'In progress', owner: 'Owen' },
  { id: 3, task: 'Review recipes', status: 'Blocked', owner: 'Lena' },
  { id: 4, task: 'Ship hotfix', status: 'Done', owner: 'Kai' },
];
/* end:skip-in-preview */

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const [undoDisabled, setUndoDisabled] = useState(true);
  const [redoDisabled, setRedoDisabled] = useState(true);

  const updateButtonsState = () => {
    const hot = hotRef.current?.hotInstance;

    if (!hot) {
      return;
    }

    const undoRedoPlugin = hot.getPlugin('undoRedo');

    setUndoDisabled(!undoRedoPlugin.isUndoAvailable());
    setRedoDisabled(!undoRedoPlugin.isRedoAvailable());
  };

  const handleUndo = () => {
    hotRef.current?.hotInstance?.getPlugin('undoRedo').undo();
    updateButtonsState();
  };

  const handleRedo = () => {
    hotRef.current?.hotInstance?.getPlugin('undoRedo').redo();
    updateButtonsState();
  };

  return (
    <div>
      <div className="example-controls-container">
        <div className="controls">
          <button type="button" onClick={handleUndo} disabled={undoDisabled}>
            Undo
          </button>
          <button type="button" onClick={handleRedo} disabled={redoDisabled}>
            Redo
          </button>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={['ID', 'Task', 'Status', 'Owner']}
        rowHeaders={true}
        width="100%"
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        undoRedo={true}
        columns={[
          { data: 'id', type: 'numeric', width: 60, readOnly: true },
          { data: 'task', type: 'text', width: 220 },
          { data: 'status', type: 'text', width: 130 },
          { data: 'owner', type: 'text', width: 120 },
        ]}
        afterChange={(_changes, source) => {
          if (source !== 'loadData') {
            updateButtonsState();
          }
        }}
        afterUndo={updateButtonsState}
        afterRedo={updateButtonsState}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
