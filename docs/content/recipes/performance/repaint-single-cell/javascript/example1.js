import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';

registerAllModules();

/* start:skip-in-preview */
const PRODUCTS = [
  ['Wireless Keyboard', 'Electronics'],
  ['USB-C Hub', 'Electronics'],
  ['Wireless Earbuds', 'Electronics'],
  ['Webcam HD', 'Electronics'],
  ['Ergonomic Chair', 'Furniture'],
  ['Standing Desk', 'Furniture'],
  ['Monitor Stand', 'Furniture'],
  ['Desk Lamp', 'Furniture'],
  ['Cable Organizer', 'Accessories'],
  ['Laptop Stand', 'Accessories'],
  ['Blue Light Glasses', 'Accessories'],
  ['Whiteboard Markers', 'Office'],
];
const STATUSES = ['Active', 'Backorder', 'Out of stock'];

const data = Array.from({ length: 500 }, (_, index) => {
  const [name, category] = PRODUCTS[index % PRODUCTS.length];

  return {
    sku: `SKU-${String(index + 1).padStart(4, '0')}`,
    name,
    category,
    price: Math.round((20 + ((index * 7) % 480)) * 100) / 100,
    stock: (index * 13) % 250,
    status: STATUSES[index % STATUSES.length],
  };
});
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
 * Clears the `td` the way Handsontable clears it before every cell render.
 *
 * Handsontable also strips `role` and `aria-*` at this point, because it
 * recycles `td` elements between different cells while you scroll. A repaint
 * always targets the same cell, so those attributes are already right for it.
 * Leave them, and you never have to rebuild them.
 */
function resetCell(td) {
  if (!td.classList.contains('hide')) { // leave the hidden-columns marker alone
    td.className = '';
  }

  td.removeAttribute('style');
  td.removeAttribute('dir');
}

/**
 * Paints one `td` by handing the work to the very function Handsontable's own
 * render loop calls once per cell.
 *
 * That one call covers the metadata lookup, `MergeCells` coordinates, the
 * `beforeValueRender` hook, the value formatter, the `beforeRenderer` and
 * `afterRenderer` hooks, and the base renderer that adds classes such as
 * `htDimmed` and `htInvalid`. None of it has to be copied here, so none of it
 * can drift when Handsontable changes.
 *
 * It takes renderable indexes, not visual ones, and `hot.view._wt` is internal.
 * That access is the one internal thing this recipe depends on, and it throws
 * if it ever moves, rather than quietly painting the wrong thing.
 */
function paintCell(hot, td, visualRow, visualColumn) {
  const renderableRow = hot.rowIndexMapper.getRenderableFromVisualIndex(visualRow);
  const renderableColumn = hot.columnIndexMapper.getRenderableFromVisualIndex(visualColumn);

  if (renderableRow === null || renderableColumn === null) {
    return false; // a hidden row or column has no cell to paint
  }

  resetCell(td);
  hot.view._wt.wtSettings.getSettingPure('cellRenderer')(renderableRow, renderableColumn, td);

  return true;
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

    if (td && !painted.includes(td) && paintCell(hot, td, visualRow, visualColumn)) {
      painted.push(td);
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
  let lastOutcome = null;
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

    if (changeSource === source) {
      // Report what the gate decided, so a fallback is visible rather than
      // looking like the repaint simply did more work than it promised.
      lastOutcome = pendingChanges ? 'repainted' : 'declined';
    }
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

  return {
    getLastOutcome: () => lastOutcome,
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
  // Demo wiring, not part of the technique: keep the selected cell selected
  // when you click one of the buttons above the grid.
  outsideClickDeselects(target) {
    return !target.closest('.example-controls-container');
  },
  licenseKey: 'non-commercial-and-evaluation',
});

const singleCellRepaint = installSingleCellRepaint(hot, { source: REPAINT_SOURCE });

const output = document.querySelector('#repaint-output');

let counter = 0;

// Used only when nothing is selected yet. Column 2 (Category) sits well inside
// the viewport at any container width.
const DEFAULT_COLUMN = 2;

/**
 * Answers which cell to write to: the one you selected, or a visible cell if
 * you have not selected anything yet.
 *
 * `highlight` is the cell you would call current. Reading the range's corners
 * instead would aim at wherever a drag began, which can be the far end.
 */
function targetCell() {
  const highlight = hot.getSelectedRangeLast()?.highlight;

  if (highlight) {
    return [highlight.row, highlight.col];
  }

  return [Math.max(0, hot.getFirstFullyVisibleRow() ?? 0), DEFAULT_COLUMN];
}

/**
 * Writes a new value into the selected cell and reports what the write cost.
 * The source decides which path the write takes -- there is no flag to toggle,
 * so an asynchronous validator cannot land after a window has closed again.
 */
function updateCell(useRepaint) {
  const [row, column] = targetCell();

  counter += 1;

  // Select before writing, always. It is what makes the cell visible: a cell
  // you scrolled away from is scrolled back into view, so the readout can never
  // name a cell you cannot see.
  hot.selectCell(row, column);

  // Reset the counter *after* selecting. Scrolling a cell into view is a real
  // render, and counting it would report the repaint as costing far more than
  // the one call it actually makes.
  rendererCalls = 0;

  const startedAt = performance.now();

  hot.setDataAtCell(
    row,
    column,
    `Updated (${counter})`,
    useRepaint ? REPAINT_SOURCE : 'edit'
  );

  const elapsed = performance.now() - startedAt;
  const cost = `${rendererCalls} renderer call${rendererCalls === 1 ? '' : 's'}, ` +
    `${elapsed.toFixed(1)} ms`;
  const where = `row ${row + 1}, ${hot.getColHeader(column)}`;

  if (useRepaint && singleCellRepaint.getLastOutcome() === 'declined') {
    output.textContent = `Repaint declined for ${where} -- the gate turned that cell ` +
      `down, so Handsontable rendered normally: ${cost}.`;

    return;
  }

  output.textContent = `${useRepaint ? 'Repaint one cell' : 'Full render'} ` +
    `(${where}): ${cost}.`;
}

document.querySelector('#full-render-btn')
  .addEventListener('click', () => updateCell(false));
document.querySelector('#repaint-cell-btn')
  .addEventListener('click', () => updateCell(true));
