import { useCallback, useMemo, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const selectedCell = (hot) => {
  const highlight = hot.getSelectedRangeLast()?.highlight;

  // with `navigableHeaders`, the highlight can sit on a header, which has a negative index
  if (!highlight || highlight.row === null || highlight.col === null || highlight.row < 0 || highlight.col < 0) {
    return null;
  }

  return { row: highlight.row, col: highlight.col };
};

const levelOf = (hot, row, col, key) => {
  if (has(hot.getCellMeta(row, col), key)) {
    return 'cell';
  }

  return has(hot.getColumnMeta(col), key) ? 'column' : 'grid';
};

// declared outside the component, so the references stay stable between renders
const gridSettings = {
  data: [
    ['Ana García', 'Engineering', 'Senior Engineer'],
    ['James Okafor', 'Marketing', 'Product Manager'],
    ['Li Wei', 'Engineering', 'Staff Engineer'],
    ['Priya Nair', 'Finance', 'Financial Analyst'],
    ['Tom Becker', 'Marketing', 'Brand Designer'],
  ],
  colHeaders: ['Name', 'Department', 'Title'],
  rowHeaders: true,
  width: 'auto',
  height: 'auto',
  // keep the selection when you click the button below the grid
  outsideClickDeselects: false,
  // let the Tab key move the focus out of the grid, to the button
  tabNavigation: false,
  // grid level
  readOnly: false,
  reviewer: 'HR team',
  // column level: the Department column
  columns: [{}, { readOnly: true, reviewer: 'Finance team' }, {}],
  // cell level: one cell in the Department column
  cell: [{ row: 1, col: 1, reviewer: 'Legal team' }],
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
};

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const [output, setOutput] = useState('Select a cell to see where its values come from.');
  const [status, setStatus] = useState('');

  const show = useCallback(() => {
    const hot = hotRef.current?.hotInstance;
    const cell = hot && selectedCell(hot);

    if (!hot || !cell) {
      return;
    }

    const { row, col } = cell;
    const meta = hot.getCellMeta(row, col);

    setOutput(
      [
        `Cell (${row}, ${col})`,
        `readOnly: ${meta.readOnly} (from the ${levelOf(hot, row, col, 'readOnly')} level)`,
        `reviewer: ${meta.reviewer} (from the ${levelOf(hot, row, col, 'reviewer')} level)`,
      ].join('\n'),
    );
  }, []);

  const setReviewer = () => {
    const hot = hotRef.current?.hotInstance;
    const cell = hot && selectedCell(hot);

    if (!hot || !cell) {
      setStatus('Select a cell first.');

      return;
    }

    hot.setCellMeta(cell.row, cell.col, 'reviewer', 'Audit team');
    show();
    setStatus(`The reviewer of cell (${cell.row}, ${cell.col}) is now Audit team.`);
  };

  // memoized, so a state change does not re-render the grid and send its settings again
  const table = useMemo(() => <HotTable ref={hotRef} {...gridSettings} afterSelection={show} />, [show]);

  return (
    <>
      {table}
      <p>
        <button type="button" onClick={setReviewer}>
          Give the selected cell its own reviewer
        </button>
      </p>
      <p role="status">{status}</p>
      <pre>{output}</pre>
    </>
  );
};

export default ExampleComponent;
