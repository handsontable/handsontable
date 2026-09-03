import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/* start:skip-in-preview */
const CATEGORIES = ['Electronics', 'Furniture', 'Accessories', 'Office'];
const STATUSES = ['Active', 'Backorder', 'Out of stock'];

const data = Array.from({ length: 500 }, (_, index) => ({
  sku: `SKU-${String(index + 1).padStart(4, '0')}`,
  name: `Product ${index + 1}`,
  category: CATEGORIES[index % CATEGORIES.length],
  price: Math.round((20 + ((index * 7) % 480)) * 100) / 100,
  stock: (index * 13) % 250,
  status: STATUSES[index % STATUSES.length],
}));
/* end:skip-in-preview */

// How many times a cell renderer ran. The counter is what makes the difference
// between the two buttons visible; the timings depend on your machine.
let rendererCalls = 0;

const priceFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/**
 * Stands in for a renderer that does real work -- parsing, formatting, building
 * child nodes, or reading from another data source. The busy loop is here only
 * so that the cost of redrawing the whole viewport is measurable in this demo.
 */
function expensiveRenderer(instance, td, row, col, prop, value, cellProperties) {
  rendererCalls += 1;

  const deadline = performance.now() + 0.1;

  while (performance.now() < deadline) { /* deliberately blocking */ }

  const displayed = prop === 'price' && typeof value === 'number'
    ? priceFormat.format(value)
    : value;

  Handsontable.renderers.TextRenderer(instance, td, row, col, prop, displayed, cellProperties);

  if (prop === 'status') {
    td.style.fontWeight = value === 'Out of stock' ? '700' : '400';
    td.style.color = value === 'Out of stock' ? '#b3261e' : 'inherit';
  }
}

/**
 * Resolves the value the renderer receives. Mirrors Handsontable's own
 * precedence: a cell-level `valueFormatter` wins, then the renderer's
 * `valueFormatter` static (the numeric and date renderers set one), then the
 * raw value.
 */
function formatCellValue(value, cellProperties, renderer) {
  if (typeof cellProperties.valueFormatter === 'function') {
    return cellProperties.valueFormatter(value, cellProperties);
  }

  if (typeof renderer === 'function' && typeof renderer.valueFormatter === 'function') {
    return renderer.valueFormatter.call(cellProperties, value, cellProperties);
  }

  return value;
}

/**
 * Clears the `td` the way Handsontable clears it before every cell render.
 * Handsontable recycles `td` elements while you scroll, so a renderer must
 * always start from a blank element.
 */
function resetCell(td) {
  if (!td.classList.contains('hide')) { // leave the hidden-columns marker alone
    td.className = '';
  }

  td.removeAttribute('style');
  td.removeAttribute('dir');

  Array.from(td.attributes).forEach(({ name }) => {
    if (name === 'role' || name.startsWith('aria-')) {
      td.removeAttribute(name);
    }
  });
}

/**
 * Runs the cell's renderer against one `td`.
 */
function paintCell(hot, td, visualRow, visualColumn) {
  resetCell(td);

  let rowToRead = visualRow;
  let columnToRead = visualColumn;
  // `MergeCells` rewrites which cell supplies the value and the metadata.
  const merged = hot.runHooks('modifyGetCellCoords', visualRow, visualColumn, false, 'meta');

  if (Array.isArray(merged)) {
    [rowToRead, columnToRead] = merged;
  }

  const cellProperties = hot.getCellMeta(rowToRead, columnToRead);
  const prop = hot.colToProp(columnToRead);
  let value = hot.getDataAtRowProp(rowToRead, prop);

  if (hot.hasHook('beforeValueRender')) {
    value = hot.runHooks('beforeValueRender', value, cellProperties);
  }

  const renderer = hot.getCellRenderer(rowToRead, columnToRead);
  const rendererArgs = [
    hot,
    td,
    visualRow,
    visualColumn,
    prop,
    formatCellValue(value, cellProperties, renderer),
    cellProperties,
  ];

  hot.runHooks('beforeRenderer', td, visualRow, visualColumn, prop, value, cellProperties);

  try {
    renderer(...rendererArgs);

    // Handsontable runs the base renderer for you, unless your renderer already
    // chained it. `_isBaseRendererCalled` is internal: check it, and always
    // reset it, or the next full render skips the base renderer for this cell.
    if (!cellProperties._isBaseRendererCalled) {
      Handsontable.renderers.BaseRenderer(...rendererArgs);
    }
  } finally {
    cellProperties._isBaseRendererCalled = false;
  }

  hot.runHooks('afterRenderer', td, visualRow, visualColumn, prop, value, cellProperties);

  if (hot.getSettings().ariaTags !== false) {
    if (!td.hasAttribute('role')) {
      td.setAttribute('role', 'gridcell');
    }

    td.setAttribute('tabindex', '-1');
    td.setAttribute(
      'aria-colindex',
      String(hot.columnIndexMapper.getRenderableFromVisualIndex(visualColumn) +
        hot.countRowHeaders() + 1)
    );
  }
}

/**
 * Repaints one cell in every copy of it that exists in the DOM.
 *
 * A cell in a frozen row exists twice: once in the top overlay and once in the
 * main table. Painting only `getCell(row, column)` leaves the second copy
 * showing the old value.
 *
 * Returns the number of elements painted. `0` means the cell is outside the
 * rendered part of the grid, so there is nothing to repaint.
 */
function repaintCell(hot, visualRow, visualColumn) {
  const painted = [];

  [true, false].forEach((topmost) => {
    const td = hot.getCell(visualRow, visualColumn, topmost);

    if (td && !painted.includes(td)) {
      painted.push(td);
      paintCell(hot, td, visualRow, visualColumn);
    }
  });

  return painted.length;
}

/**
 * Makes `setDataAtCell()` repaint only the cells it changed, instead of
 * redrawing the whole viewport.
 *
 * The gate is deliberately narrow. Anything it turns down falls through to a
 * normal render, so correctness never depends on the caller reading the rules.
 */
function installSingleCellRepaint(hot, { maxCells = 8 } = {}) {
  let pendingChanges = null;
  let enabled = false;
  const counts = { rows: 0, columns: 0 };

  function isRepaintable(changes) {
    if (!enabled || !changes || changes.length === 0 || changes.length > maxCells) {
      return false;
    }

    // A new spare row or a grown column changes the grid's shape. Only a full
    // render can lay that out.
    if (hot.countRows() !== counts.rows || hot.countCols() !== counts.columns) {
      return false;
    }

    return changes.every(([row, prop]) => {
      const column = hot.propToCol(prop);

      // `null` means the cell is not rendered, so there is no element to paint.
      return typeof column === 'number' && hot.getCell(row, column, true) !== null;
    });
  }

  hot.addHook('beforeChange', () => {
    counts.rows = hot.countRows();
    counts.columns = hot.countCols();
  });

  hot.addHook('beforeChangeRender', (changes) => {
    pendingChanges = isRepaintable(changes) ? changes : null;
  });

  hot.addHook('beforeViewRender', (isForced, skipRenderObject) => {
    if (pendingChanges) {
      skipRenderObject.skipRender = true;
    }
  });

  hot.addHook('afterChange', (changes, source) => {
    if (pendingChanges && source !== 'loadData') {
      pendingChanges.forEach(([row, prop]) => {
        repaintCell(hot, row, hot.propToCol(prop));
      });
    }

    pendingChanges = null;
  });

  return {
    enable() { enabled = true; },
    disable() { enabled = false; },
  };
}

const hot = new Handsontable(document.querySelector('#example1'), {
  data,
  colHeaders: ['SKU', 'Name', 'Category', 'Price', 'Stock', 'Status'],
  // No `type` here on purpose: a column-level `type` sets that column's
  // renderer, which would override the `renderer` option below.
  columns: [
    { data: 'sku', width: 100 },
    { data: 'name', width: 150 },
    { data: 'category', width: 120 },
    { data: 'price', width: 90, className: 'htRight' },
    { data: 'stock', width: 80, className: 'htRight' },
    { data: 'status', width: 120 },
  ],
  rowHeaders: true,
  renderer: expensiveRenderer,
  height: 320,
  // Fixed sizes are a requirement of this recipe, not a detail of the demo.
  // Auto-sizing measures by running your renderer in an off-screen table, so
  // leaving it on both breaks the layout and hides the saving you are after.
  rowHeights: 30,
  autoRowSize: false,
  autoColumnSize: false,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const singleCellRepaint = installSingleCellRepaint(hot);
const output = document.querySelector('#repaint-output');

let counter = 0;

/**
 * Writes a new status into a visible cell and reports what the write cost.
 */
function updateCell(useRepaint) {
  counter += 1;

  const nextValue = `Active (${counter})`;

  if (useRepaint) {
    singleCellRepaint.enable();
  }

  rendererCalls = 0;

  const startedAt = performance.now();

  hot.setDataAtCell(2, 5, nextValue);

  const elapsed = performance.now() - startedAt;

  singleCellRepaint.disable();

  output.textContent = `${useRepaint ? 'Repaint one cell' : 'Full render'}: ` +
    `${rendererCalls} renderer call${rendererCalls === 1 ? '' : 's'}, ` +
    `${elapsed.toFixed(1)} ms.`;
}

document.querySelector('#full-render-btn')
  .addEventListener('click', () => updateCell(false));
document.querySelector('#repaint-cell-btn')
  .addEventListener('click', () => updateCell(true));
