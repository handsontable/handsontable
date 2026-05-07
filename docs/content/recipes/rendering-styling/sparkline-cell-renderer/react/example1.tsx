import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { BaseRenderer, registerRenderer, baseRenderer } from 'handsontable/renderers';
import { registerCellType } from 'handsontable/cellTypes';
import './example1.css';

registerAllModules();

const SLOT = 10;
const GAP = 2;
const VIEW_HEIGHT = 100;
const WEEK_KEYS = ['w1', 'w2', 'w3', 'w4', 'w5'] as const;
const VIEW_WIDTH = WEEK_KEYS.length * SLOT - GAP;

// Returns null for invalid/non-numeric values, preserving each slot's position.
function toSlots(rowData: Record<string, unknown> | null): (number | null)[] {
  return WEEK_KEYS.map((key) => {
    const value = rowData?.[key];
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : null;
  });
}

// Inline SVG bar chart generated from the row's w1-w5 values.
const sparklineRenderer: BaseRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  baseRenderer(instance, td, row, col, prop, value, cellProperties);

  const sourceRow = instance.getSourceDataAtRow(row) as Record<string, unknown> | null;
  const slots = toSlots(sourceRow);
  const validNumbers = slots.filter((n): n is number => n !== null);

  if (validNumbers.length === 0) {
    td.textContent = '—';
    td.title = 'No data';
    return;
  }

  const rowMax = validNumbers.reduce((m, n) => Math.max(m, Math.abs(n)), 0);

  if (rowMax === 0) {
    td.textContent = '—';
    td.title = 'All values are zero';
    return;
  }

  const average = validNumbers.reduce((sum, n) => sum + n, 0) / validNumbers.length;
  const rects = slots
    .map((n, i) => {
      if (n === null) return '';
      const barHeight = (Math.abs(n) / rowMax) * VIEW_HEIGHT;
      const x = i * SLOT;
      const y = VIEW_HEIGHT - barHeight;
      const w = SLOT - GAP;
      const fill = n >= average ? '#16a34a' : '#dc2626';

      return `<rect x="${x}" y="${y}" width="${w}" height="${barHeight}" fill="${fill}"/>`;
    })
    .join('');

  td.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${rects}</svg>`;
  td.removeAttribute('title');
};

registerRenderer('sparklineBar', sparklineRenderer);
registerCellType('sparklineBar', { renderer: sparklineRenderer });

/* start:skip-in-preview */
const data = [
  { product: 'Desk lamp', w1: 4, w2: 8, w3: 2, w4: 9, w5: 5 },
  { product: 'Monitor arm', w1: 1, w2: 1, w3: 0, w4: 0, w5: 0 },
  { product: 'USB hub', w1: null, w2: null, w3: null, w4: null, w5: null },
  { product: 'Mouse', w1: undefined, w2: undefined, w3: 3, w4: 5, w5: 2 },
  { product: 'Keyboard', w1: 3, w2: 6, w3: 7, w4: 4, w5: 8 },
  { product: 'Webcam', w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
];
/* end:skip-in-preview */

const ExampleComponent = () => {
  return (
    <HotTable
      id="example1"
      data={data}
      rowHeaders={true}
      rowHeights={44}
      colHeaders={['Product', 'W1', 'W2', 'W3', 'W4', 'W5', 'Sparkline']}
      licenseKey="non-commercial-and-evaluation"
      height="auto"
      width="100%"
      columns={[
        { data: 'product', type: 'text', width: 100, readOnly: true },
        { data: 'w1', type: 'numeric', width: 48 },
        { data: 'w2', type: 'numeric', width: 48 },
        { data: 'w3', type: 'numeric', width: 48 },
        { data: 'w4', type: 'numeric', width: 48 },
        { data: 'w5', type: 'numeric', width: 48 },
        {
          data: null,
          width: 160,
          type: 'sparklineBar',
          className: 'htMiddle sparkline-cell',
          readOnly: true,
        },
      ]}
    />
  );
};

export default ExampleComponent;
