import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import { baseRenderer } from 'handsontable/renderers/baseRenderer';

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

// The source this recipe reacts to. Writes from anywhere else render normally.
const REPAINT_SOURCE = 'single-cell-repaint';

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

  textRenderer(instance, td, row, col, prop, displayed, cellProperties);

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

  // Pass the metadata you already hold. `getCellRenderer(row, column)` would
  // resolve it again, re-running the `cells` function this recipe exists to
  // avoid. This is also what Handsontable's own render path does.
  const renderer = hot.getCellRenderer(cellProperties);
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
      baseRenderer(...rendererArgs);
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
 * Repaints one cell in the copies of it that `getCell()` can reach: the topmost
 * one and the one in the main table. Outside a frozen area those are the only
 * two, and usually the same element.
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
 * Makes writes from `REPAINT_SOURCE` repaint only the cells they changed,
 * instead of redrawing the whole viewport.
 *
 * The gate is deliberately narrow. Anything it turns down falls through to a
 * normal render, so correctness never depends on the caller reading the rules.
 */
function installSingleCellRepaint(hot, { source, maxCells = 8 } = {}) {
  let pendingChanges = null;
  const counts = { rows: 0, columns: 0 };

  /**
   * A cell in a frozen area exists in more than one table -- up to four, when
   * both axes are frozen -- and `getCell()` reaches only two of them. Rather
   * than guess, hand those cells to a normal render.
   */
  function isInFrozenArea(row, column) {
    const { fixedRowsTop, fixedRowsBottom, fixedColumnsStart } = hot.getSettings();

    return row < fixedRowsTop ||
      row >= hot.countRows() - fixedRowsBottom ||
      column < fixedColumnsStart;
  }

  function isRepaintable(changes, changeSource) {
    if (changeSource !== source || !changes || changes.length === 0 || changes.length > maxCells) {
      return false;
    }

    // A new spare row or a grown column changes the grid's shape. Only a full
    // render can lay that out.
    if (hot.countRows() !== counts.rows || hot.countCols() !== counts.columns) {
      return false;
    }

    return changes.every(([row, prop]) => {
      const column = hot.propToCol(prop);

      if (typeof column !== 'number' || isInFrozenArea(row, column)) {
        return false;
      }

      // A missing element means the cell is not rendered, so there is nothing
      // to paint. `getCell()` answers with `null` or `undefined`.
      return hot.getCell(row, column, true) != null;
    });
  }

  hot.addHook('beforeChange', () => {
    counts.rows = hot.countRows();
    counts.columns = hot.countCols();
  });

  hot.addHook('beforeChangeRender', (changes, changeSource) => {
    pendingChanges = isRepaintable(changes, changeSource) ? changes : null;
  });

  // Cancel the cell drawing and repaint here, not in `afterChange`. Handsontable
  // renders the selection at the end of this same draw, so a repaint that runs
  // afterwards would wipe the selection classes off the cell you just edited.
  hot.addHook('beforeViewRender', (isForced, skipRenderObject) => {
    if (!pendingChanges) {
      return;
    }

    skipRenderObject.skipRender = true;

    pendingChanges.forEach(([row, prop]) => {
      repaintCell(hot, row, hot.propToCol(prop));
    });

    pendingChanges = null;
  });
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

installSingleCellRepaint(hot, { source: REPAINT_SOURCE });

const output = document.querySelector('#repaint-output');

let counter = 0;

/**
 * Writes a new status into a visible cell and reports what the write cost. The
 * source decides which path the write takes -- there is no flag to toggle, so
 * an asynchronous validator cannot land after a window has closed again.
 */
function updateCell(useRepaint) {
  counter += 1;
  rendererCalls = 0;

  const startedAt = performance.now();

  hot.setDataAtCell(2, 5, `Active (${counter})`, useRepaint ? REPAINT_SOURCE : 'edit');

  const elapsed = performance.now() - startedAt;

  output.textContent = `${useRepaint ? 'Repaint one cell' : 'Full render'}: ` +
    `${rendererCalls} renderer call${rendererCalls === 1 ? '' : 's'}, ` +
    `${elapsed.toFixed(1)} ms.`;
}

document.querySelector('#full-render-btn')
  .addEventListener('click', () => updateCell(false));
document.querySelector('#repaint-cell-btn')
  .addEventListener('click', () => updateCell(true));
