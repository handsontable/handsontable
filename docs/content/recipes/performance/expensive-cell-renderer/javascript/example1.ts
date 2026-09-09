import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { BaseRenderer, baseRenderer } from 'handsontable/renderers';

registerAllModules();

type OrderRow = {
  id: number;
  customer: string;
  region: string;
  sales: number[];
};

/* start:skip-in-preview */
const CUSTOMERS = ['Acme Corp', 'Vertex Industries', 'Harbor Goods', 'Alpine Supply Co.', 'Northwind Traders', 'Lumen Retail'];
const REGIONS = ['North', 'South', 'East', 'West'];

// Twelve monthly sales figures per customer, generated deterministically so every load looks the same.
function createRows(count: number): OrderRow[] {
  const rows: OrderRow[] = [];

  for (let index = 0; index < count; index += 1) {
    const sales: number[] = [];
    let seed = (index + 1) * 7919;

    for (let month = 0; month < 12; month += 1) {
      seed = (seed * 48271) % 2147483647;
      sales.push(1000 + (seed % 9000));
    }

    rows.push({
      id: 1001 + index,
      customer: CUSTOMERS[index % CUSTOMERS.length],
      region: REGIONS[index % REGIONS.length],
      sales,
    });
  }

  return rows;
}
/* end:skip-in-preview */

const data = createRows(300);
const stats = { rendererCalls: 0, computations: 0 };

// The slow part of the renderer: a text sparkline plus the change from the first to the last month.
// It is a pure function -- the same input always gives the same output -- so its result can be cached.
function buildTrend(sales: number[]): string {
  const glyphs = '▁▂▃▄▅▆▇█';
  const min = Math.min(...sales);
  const max = Math.max(...sales);
  const range = max - min || 1;
  const bars = sales
    .map((value) => glyphs[Math.round(((value - min) / range) * (glyphs.length - 1))])
    .join('');
  const change = Math.round(((sales[sales.length - 1] - sales[0]) / sales[0]) * 100);

  return `${bars} ${change >= 0 ? '+' : ''}${change}%`;
}

// One cache entry per data record, never per `td`: the grid reuses a `td` for a different record
// as you scroll. A WeakMap releases the entry together with the record. Each entry remembers the
// input it was computed from, so a replaced array is computed again.
const trendCache = new WeakMap<OrderRow, { input: number[]; output: string }>();

const trendRenderer: BaseRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  baseRenderer(instance, td, row, col, prop, value, cellProperties);
  stats.rendererCalls += 1;

  // `row` is a visual index; the data array is in physical order. Read the record from your own
  // array: `getSourceDataAtRow()` returns a copy of the row, which can never be a WeakMap key.
  const record = data[instance.toPhysicalRow(row) as number];
  const sales = value as number[];
  let entry = trendCache.get(record);

  if (!entry || entry.input !== sales) {
    stats.computations += 1;
    entry = { input: sales, output: buildTrend(sales) };
    trendCache.set(record, entry);
  }

  td.textContent = entry.output;
};

const container = document.querySelector<HTMLElement>('#example1')!;
const statsElement = document.querySelector<HTMLElement>('#render-stats')!;

const hot = new Handsontable(container, {
  data,
  colHeaders: ['ID', 'Customer', 'Region', 'Trend (12 months)'],
  columns: [
    { data: 'id', type: 'numeric', width: 70, readOnly: true },
    { data: 'customer', type: 'text', width: 170 },
    { data: 'region', type: 'text', width: 90 },
    { data: 'sales', renderer: trendRenderer, width: 190, readOnly: true },
  ],
  rowHeaders: true,
  height: 320,
  width: '100%',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',
  // Runs once per draw, scroll draws included, after every cell renderer. Keep DOM writes like
  // this one out of the renderer.
  afterViewRender() {
    statsElement.textContent = `Renderer calls: ${stats.rendererCalls} | Computations: ${stats.computations}`;
  },
});

document.querySelector('#render-again-btn')!.addEventListener('click', () => {
  hot.render();
});

document.querySelector('#update-row-btn')!.addEventListener('click', () => {
  // Replace the array instead of changing it in place: the renderer compares inputs by identity.
  const nextSales = data[0].sales.map((value, month) => Math.round(value * (1 + month / 10)));

  hot.setSourceDataAtCell(0, 'sales', nextSales);
});
