import { useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/* start:skip-in-preview */
const INITIAL_DATA = [
  ['Migrate auth service to OAuth 2.0', 'Alice Johnson', 'High', 'In Progress'],
  ['Write API documentation', 'Bob Smith', 'Normal', 'To Do'],
  ['Fix pagination bug on dashboard', 'Carol White', 'High', 'In Review'],
  ['Add CSV export feature', 'David Lee', 'Normal', 'To Do'],
  ['Upgrade React to v19', 'Eve Martinez', 'Low', 'Backlog'],
  ['Implement dark mode toggle', 'Frank Brown', 'Normal', 'In Progress'],
  ['Set up end-to-end test suite', 'Grace Kim', 'High', 'To Do'],
  ['Refactor database connection pool', 'Henry Wilson', 'Low', 'Backlog'],
];
/* end:skip-in-preview */

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const getHot = () => hotRef.current?.hotInstance;

  const isFirst = selectedRow === 0;
  const isLast = selectedRow !== null && getHot() && selectedRow === getHot().countRows() - 1;

  const handleAddRow = () => {
    const hot = getHot();

    if (!hot) {
      return;
    }

    hot.alter('insert_row_below', hot.countRows() - 1);
  };

  const handleDeleteRow = () => {
    const hot = getHot();
    const selected = hot?.getSelected();

    if (!selected) {
      return;
    }

    const rowSet = new Set();

    selected.forEach(([r1, , r2]) => {
      const from = Math.min(r1, r2);
      const to = Math.max(r1, r2);

      for (let r = from; r <= to; r++) {
        rowSet.add(r);
      }
    });

    // Delete from bottom to top so earlier indices stay valid
    const rows = [...rowSet].sort((a, b) => b - a);

    rows.forEach((row) => hot.alter('remove_row', row, 1));
  };

  const handleMoveUp = () => {
    const hot = getHot();

    if (selectedRow === null || selectedRow === 0 || !hot) {
      return;
    }

    hot.getPlugin('manualRowMove').moveRow(selectedRow, selectedRow - 1);
    hot.render();
    const newRow = selectedRow - 1;

    hot.selectRows(newRow);
    setSelectedRow(newRow);
  };

  const handleMoveDown = () => {
    const hot = getHot();

    if (selectedRow === null || !hot || selectedRow === hot.countRows() - 1) {
      return;
    }

    hot.getPlugin('manualRowMove').moveRow(selectedRow, selectedRow + 2);
    hot.render();
    const newRow = selectedRow + 1;

    hot.selectRows(newRow);
    setSelectedRow(newRow);
  };

  const handleSelectionEnd = (row, _col, row2) => {
    setSelectedRow(row === row2 ? row : null);
  };

  const handleDeselect = () => {
    setSelectedRow(null);
  };

  const toolbarRef = useRef(null);

  const outsideClickDeselects = (target) => {
    return !toolbarRef.current?.contains(target);
  };

  return (
    <>
      <div className="example-controls-container" ref={toolbarRef}>
        <div className="controls">
          <button type="button" onClick={handleAddRow}>
            Add Row
          </button>
          <button type="button" onClick={handleDeleteRow} disabled={selectedRow === null}>
            Delete Row
          </button>
          <button type="button" onClick={handleMoveUp} disabled={selectedRow === null || isFirst}>
            Move Up
          </button>
          <button
            type="button"
            onClick={handleMoveDown}
            disabled={selectedRow === null || isLast}
          >
            Move Down
          </button>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={INITIAL_DATA}
        colHeaders={['Task', 'Assignee', 'Priority', 'Status']}
        rowHeaders={true}
        height="auto"
        width="100%"
        manualRowMove={true}
        outsideClickDeselects={outsideClickDeselects}
        afterSelectionEnd={handleSelectionEnd}
        afterDeselect={handleDeselect}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
