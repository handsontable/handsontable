import { useCallback, useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { baseRenderer, textRenderer } from 'handsontable/renderers';

registerAllModules();

/* start:skip-in-preview */
const CUSTOMERS = ['Acme Corp', 'Vertex Industries', 'Harbor Goods', 'Alpine Supply Co.', 'Northwind Traders', 'Lumen Retail'];
const REGIONS = ['North', 'South', 'East', 'West'];

// Twelve monthly sales figures per customer, generated deterministically so every load looks the same.
function createRows(count) {
  const rows = [];

  for (let index = 0; index < count; index += 1) {
    const sales = [];
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
function buildTrend(sales) {
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
const trendCache = new WeakMap();

const trendRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  baseRenderer(instance, td, row, col, prop, value, cellProperties);
  stats.rendererCalls += 1;

  // `row` is a visual index, and `data` is in physical order, so translate before the lookup.
  // Read the record from your own array: `getSourceDataAtRow()` returns a copy of the row on
  // every call, which can never be a WeakMap key. Keep this closure and the grid's data source
  // the same array -- after `updateData()`, point it at the new one.
  const record = data[instance.toPhysicalRow(row)];
  const sales = value;

  // A row without a record (a `minSpareRows` row, or one mid-`alter()`) and an empty cell both
  // reach the renderer. Neither can be cached: `undefined` is not a valid WeakMap key.
  if (!record || !Array.isArray(sales) || sales.length === 0) {
    textRenderer(instance, td, row, col, prop, '—', cellProperties);

    return;
  }

  let entry = trendCache.get(record);

  if (!entry || entry.input !== sales) {
    stats.computations += 1;
    entry = { input: sales, output: buildTrend(sales) };
    trendCache.set(record, entry);
  }

  // Write through the built-in text renderer rather than setting `td.textContent`. On a row with
  // an exact height the engine keeps the cell's content inside a wrapper, and this writes into
  // that wrapper instead of replacing it.
  textRenderer(instance, td, row, col, prop, entry.output, cellProperties);
};

const COLUMNS = [
  { data: 'id', type: 'numeric', width: 70, readOnly: true },
  { data: 'customer', type: 'text', width: 170 },
  { data: 'region', type: 'text', width: 90 },
  { data: 'sales', renderer: trendRenderer, width: 190, readOnly: true },
];

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const statsRef = useRef(null);

  // Runs once per draw, scroll draws included, after every cell renderer. The counters change on
  // every draw, so write them straight into the DOM rather than into React state, which would
  // re-render the component on every draw.
  const handleAfterViewRender = useCallback(() => {
    if (statsRef.current) {
      statsRef.current.textContent = `Renderer calls: ${stats.rendererCalls} | Computations: ${stats.computations}`;
    }
  }, []);

  const renderAgain = useCallback(() => {
    hotRef.current?.hotInstance?.render();
  }, []);

  const updateFirstRow = useCallback(() => {
    const hot = hotRef.current?.hotInstance;

    if (!hot) {
      return;
    }

    // Bring the first row into view, so its renderer runs and the counter shows the single
    // recomputation. A cell outside the rendered band is not painted at all.
    hot.scrollViewportTo({ row: 0 });

    // Replace the array instead of changing it in place: the renderer compares inputs by identity.
    const nextSales = data[0].sales.map((value, month) => Math.round(value * (1 + month / 10)));

    hot.setSourceDataAtCell(0, 'sales', nextSales);
  }, []);

  return (
    <div>
      <div className="example-controls-container">
        <div className="controls">
          <button type="button" onClick={renderAgain}>Render again</button>
          <button type="button" onClick={updateFirstRow}>Update the first row</button>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={['ID', 'Customer', 'Region', 'Trend (12 months)']}
        columns={COLUMNS}
        rowHeaders={true}
        height={320}
        width="100%"
        autoWrapRow={true}
        licenseKey="non-commercial-and-evaluation"
        afterViewRender={handleAfterViewRender}
      />
      <p ref={statsRef} style={{ margin: '8px 0 0', fontSize: 13, color: '#666' }}>
        Renderer calls: 0 | Computations: 0
      </p>
    </div>
  );
};

export default ExampleComponent;
