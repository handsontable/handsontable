import { useCallback, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

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
  outsideClickDeselects: false,
  tabNavigation: false,
  // grid level
  readOnly: false,
  reviewer: 'HR team',
  // column level: the Department column
  columns: [{}, { readOnly: true, reviewer: 'Finance team' }, {}],
  // cell level: one cell in the Department column
  cell: [{ row: 1, col: 1, reviewer: 'Legal team' }],
  licenseKey: 'non-commercial-and-evaluation',
};

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const [output, setOutput] = useState('Select a cell to see where its values come from.');

  const show = useCallback((row, col) => {
    const hot = hotRef.current?.hotInstance;

    if (!hot || row < 0 || col < 0) {
      return;
    }

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
    const selected = hot?.getSelectedLast();

    if (!hot || !selected || selected[0] < 0 || selected[1] < 0) {
      setOutput('Select a cell first.');

      return;
    }

    hot.setCellMeta(selected[0], selected[1], 'reviewer', 'Audit team');
    show(selected[0], selected[1]);
  };

  return (
    <>
      <HotTable ref={hotRef} {...gridSettings} afterSelection={show} />
      <p>
        <button type="button" onClick={setReviewer}>
          Give the selected cell its own reviewer
        </button>
      </p>
      <pre role="status" aria-label="Metadata of the selected cell">
        {output}
      </pre>
    </>
  );
};

export default ExampleComponent;
