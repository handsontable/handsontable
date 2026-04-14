import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import {
  BaseRenderer,
  registerRenderer,
  baseRenderer,
} from 'handsontable/renderers';

registerAllModules();

const SLOT = 10;
const GAP = 2;
const VIEW_HEIGHT = 100;

function toNumbers(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((v) => (typeof v === 'number' ? v : Number(v)))
    .filter((n) => Number.isFinite(n));
}

// Inline SVG bars: height tracks share of max; optional red/green vs row average.
const sparklineRenderer: BaseRenderer = (
  instance,
  td,
  row,
  col,
  prop,
  value,
  cellProperties
) => {
  baseRenderer(instance, td, row, col, prop, value, cellProperties);

  const numbers = toNumbers(value);
  const max = numbers.reduce((m, n) => Math.max(m, Math.abs(n)), 0);

  if (numbers.length === 0 || max === 0) {
    td.textContent = '\u2014';
    td.title = numbers.length === 0 ? 'No data' : 'All values are zero';

    return;
  }

  const average =
    numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const viewWidth = numbers.length * SLOT - GAP;
  const rects = numbers
    .map((n, i) => {
      const barHeight = (Math.abs(n) / max) * VIEW_HEIGHT;
      const x = i * SLOT;
      const y = VIEW_HEIGHT - barHeight;
      const w = SLOT - GAP;
      const fill = n >= average ? '#16a34a' : '#dc2626';

      return `<rect x="${x}" y="${y}" width="${w}" height="${barHeight}" fill="${fill}"/>`;
    })
    .join('');

  td.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 ${viewWidth} ${VIEW_HEIGHT}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${rects}</svg>`;
  td.removeAttribute('title');
};

registerRenderer('sparklineBar', sparklineRenderer);

/* start:skip-in-preview */
const data = [
  { product: 'Desk lamp', region: 'EU', trend: [4, 8, 2, 9, 5], stock: 42 },
  { product: 'Monitor arm', region: 'US', trend: [1, 1, 0, 0, 0], stock: 8 },
  { product: 'USB hub', region: 'APAC', trend: [], stock: 0 },
  { product: 'Mouse', region: 'EU', stock: 30 },
  { product: 'Keyboard', region: 'EU', trend: [3, 6, 7, 4, 8], stock: 120 },
  { product: 'Webcam', region: 'US', trend: [0, 0, 0, 0, 0], stock: 15 },
];
/* end:skip-in-preview */

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  data,
  rowHeaders: true,
  rowHeights: 44,
  colHeaders: ['Product', 'Region', 'Weekly units (sparkline)', 'Stock'],
  licenseKey: 'non-commercial-and-evaluation',
  height: 'auto',
  width: '100%',
  columns: [
    { data: 'product', type: 'text', width: 140 },
    { data: 'region', type: 'text', width: 80 },
    {
      data: 'trend',
      width: 220,
      renderer: 'sparklineBar',
      className: 'htMiddle sparkline-cell',
      readOnly: true,
    },
    { data: 'stock', type: 'numeric', width: 70 },
  ],
});
