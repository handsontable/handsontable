import { useRef, useState } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import Handsontable from 'handsontable/base';
import './example1.css';

registerAllModules();

const COLUMN_LABELS = ['Item', 'Quantity', 'Unit price'];

/** Column index -> returns `null` when valid, otherwise an error message. */
const validationRules: Record<number, (value: unknown) => string | null> = {
  0: (value) => {
    const text = String(value ?? '').trim();

    return text.length > 0 ? null : 'Item name is required';
  },
  1: (value) => {
    if (value === null || value === '') {
      return 'Quantity is required';
    }

    const n = Number(value);

    return !Number.isNaN(n) && n > 0 && Number.isInteger(n)
      ? null
      : 'Quantity must be a positive whole number';
  },
  2: (value) => {
    if (value === null || value === '') {
      return 'Unit price is required';
    }

    const n = Number(value);

    return !Number.isNaN(n) && n > 0 ? null : 'Unit price must be greater than 0';
  },
};

interface Issue {
  row: number;
  col: number;
  message: string;
}

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

const initialData = [
  { item: 'Widget A', qty: 2, price: 19.99 },
  { item: '', qty: 1, price: 5 },
  { item: 'Gadget', qty: -1, price: 12 },
  { item: 'Cable', qty: 3, price: 0 },
];

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);
  const invalidCellsRef = useRef<Set<string>>(new Set());
  const [issues, setIssues] = useState<Issue[]>([]);

  function afterRenderer(TD: HTMLTableCellElement, row: number, col: number): void {
    TD.style.backgroundColor = invalidCellsRef.current.has(cellKey(row, col))
      ? 'var(--ht-cell-error-background-color, #ffe4e4)'
      : '';
  }

  function afterChange(
    changes: Handsontable.CellChange[] | null,
    source: Handsontable.ChangeSource
  ): void {
    const hot = hotRef.current?.hotInstance;

    if (!hot || source === 'loadData' || !changes) {
      return;
    }

    let touched = false;

    for (const change of changes) {
      const [row, prop] = change;
      const col = typeof prop === 'string' ? hot.propToCol(prop) : (prop as number);
      const key = cellKey(row, col);

      if (!invalidCellsRef.current.has(key)) {
        continue;
      }

      hot.removeCellMeta(row, col, 'className');
      hot.removeCellMeta(row, col, 'title');
      invalidCellsRef.current.delete(key);
      touched = true;
    }

    if (touched) {
      setIssues((prev) =>
        prev.filter((i) => invalidCellsRef.current.has(cellKey(i.row, i.col)))
      );
      hot.render();
    }
  }

  function handleSubmit(): void {
    const hot = hotRef.current?.hotInstance;

    if (!hot) {
      return;
    }

    invalidCellsRef.current.forEach((key) => {
      const [r, c] = key.split(':').map(Number);

      hot.removeCellMeta(r, c, 'className');
      hot.removeCellMeta(r, c, 'title');
    });
    invalidCellsRef.current.clear();

    const newIssues: Issue[] = [];

    for (let row = 0; row < hot.countRows(); row++) {
      for (let col = 0; col < hot.countCols(); col++) {
        const rule = validationRules[col];

        if (!rule) {
          continue;
        }

        const value = hot.getDataAtCell(row, col);
        const message = rule(value);

        if (message !== null) {
          newIssues.push({ row, col, message });
        }
      }
    }

    newIssues.forEach((issue) => {
      hot.setCellMeta(issue.row, issue.col, 'className', 'htInvalid');
      hot.setCellMeta(issue.row, issue.col, 'title', issue.message);
      invalidCellsRef.current.add(cellKey(issue.row, issue.col));
    });

    hot.render();
    setIssues(newIssues);
  }

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button type="button" onClick={handleSubmit}>
            Submit orders
          </button>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={initialData}
        colHeaders={COLUMN_LABELS}
        columns={[
          { data: 'item', type: 'text', width: 180 },
          { data: 'qty', type: 'numeric', width: 100 },
          { data: 'price', type: 'numeric', numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 }, width: 110 },
        ]}
        rowHeaders={true}
        height="auto"
        width="100%"
        afterRenderer={afterRenderer}
        afterChange={afterChange}
        licenseKey="non-commercial-and-evaluation"
      />
      <div className="example-controls-container validation-summary" aria-live="polite">
        <p className="validation-summary__title">Validation issues</p>
        <ul className="validation-summary__list">
          {issues.map((issue) => (
            <li key={cellKey(issue.row, issue.col)}>
              Row {issue.row + 1}, {COLUMN_LABELS[issue.col]}: {issue.message}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default ExampleComponent;
