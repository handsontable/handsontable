import Handsontable from 'handsontable/base';
import { registerPlugin, ColumnSummary } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';
import { TrimRows } from '../../trimRows';
import { ManualColumnMove } from '../../manualColumnMove';

registerAllCellTypes();
registerPlugin(ColumnSummary);
registerPlugin(TrimRows);
registerPlugin(ManualColumnMove);

/**
 * DEV-148: the plugin owns the `readOnly` state of a read-only summary cell. A `setCellMeta` that
 * would make one writable is vetoed, and so is a `removeCellMeta` of its `readOnly` key. That is the
 * path the "Read only" menu item, its undo, and its redo all write through. A summary configured
 * `readOnly: false` is not locked.
 */
describe('ColumnSummary read-only lock', () => {
  let container;
  let hot;
  let originalScrollIntoView;
  let originalScrollTo;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    originalScrollTo = window.scrollTo;
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.scrollTo = () => {};
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    window.scrollTo = originalScrollTo;
  });

  /**
   * Builds a grid with a read-only summary in (2, 0) and a `readOnly: false` summary in (2, 1).
   *
   * @param {object} [options] Extra settings.
   * @returns {Handsontable} The created instance.
   */
  function buildGrid(options = {}) {
    return new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[10, 1, 'a'], [20, 2, 'b'], [null, null, 'c']],
      columnSummary: [
        { destinationColumn: 0, destinationRow: 2, ranges: [[0, 1]], type: 'sum' },
        { destinationColumn: 1, destinationRow: 2, ranges: [[0, 1]], type: 'sum', readOnly: false },
      ],
      ...options,
    });
  }

  it('reports only the destination of a read-only summary as locked', () => {
    hot = buildGrid();

    const plugin = hot.getPlugin('columnSummary');

    expect(plugin.isLockedSummaryCell(2, 0)).toBe(true);
    expect(plugin.isLockedSummaryCell(2, 1)).toBe(false);
    expect(plugin.isLockedSummaryCell(2, 2)).toBe(false);
    expect(plugin.isLockedSummaryCell(0, 0)).toBe(false);
  });

  it('vetoes a `setCellMeta` that would make a read-only summary cell writable', () => {
    hot = buildGrid();

    const afterSetCellMeta = jest.fn();

    hot.addHook('afterSetCellMeta', afterSetCellMeta);

    hot.setCellMeta(2, 0, 'readOnly', false);

    expect(hot.getCellMeta(2, 0).readOnly).toBe(true);
    expect(afterSetCellMeta).not.toHaveBeenCalled();

    // Any other key still goes through, a falsy one included. Every `readOnly` write is vetoed,
    // even one that keeps the cell's current value - see `#onBeforeSetCellMeta`'s own doc for why.
    hot.setCellMeta(2, 0, 'placeholder', 'total');
    hot.setCellMeta(2, 0, 'placeholder', '');
    hot.setCellMeta(2, 0, 'readOnly', true);

    expect(hot.getCellMeta(2, 0).placeholder).toBe('');
    expect(hot.getCellMeta(2, 0).readOnly).toBe(true);
    expect(afterSetCellMeta).toHaveBeenCalledTimes(2);
  });

  it('vetoes a `removeCellMeta` of the `readOnly` key on a read-only summary cell', () => {
    hot = buildGrid();

    hot.removeCellMeta(2, 0, 'readOnly');

    expect(hot.getCellMeta(2, 0).readOnly).toBe(true);

    // Control: removing another key of the summary cell, and `readOnly` of a plain cell, still works.
    hot.setCellMeta(2, 0, 'placeholder', 'total');
    hot.removeCellMeta(2, 0, 'placeholder');
    hot.setCellMeta(0, 0, 'readOnly', true);
    hot.removeCellMeta(0, 0, 'readOnly');

    expect(hot.getCellMeta(2, 0).placeholder).toBeUndefined();
    expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
  });

  it('locks the destination of a summary configured through a function', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[10, 1], [20, 2], [null, null]],
      columnSummary() {
        return [
          { destinationColumn: 0, destinationRow: 2, ranges: [[0, 1]], type: 'sum' },
          { destinationColumn: 1, destinationRow: 2, ranges: [[0, 1]], type: 'sum', readOnly: false },
        ];
      },
    });

    const plugin = hot.getPlugin('columnSummary');

    expect(plugin.isLockedSummaryCell(2, 0)).toBe(true);
    expect(plugin.isLockedSummaryCell(2, 1)).toBe(false);

    hot.setCellMeta(2, 0, 'readOnly', false);

    expect(hot.getCellMeta(2, 0).readOnly).toBe(true);
  });

  it('agrees with the cell meta when two endpoints share a destination', () => {
    const build = columnSummary => new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[10, 1], [20, 2], [null, null]],
      columnSummary,
    });
    const readOnlyEndpoint = { destinationColumn: 0, destinationRow: 2, ranges: [[0, 1]], type: 'sum' };
    const writableEndpoint = { ...readOnlyEndpoint, type: 'max', readOnly: false };

    // A misconfiguration, but the lock must still describe the cell: the endpoints write their
    // `readOnly` in order, so the last one decides both.
    hot = build([readOnlyEndpoint, writableEndpoint]);

    expect(hot.getCellMeta(2, 0).readOnly).toBe(false);
    expect(hot.getPlugin('columnSummary').isLockedSummaryCell(2, 0)).toBe(false);

    hot.destroy();
    hot = build([writableEndpoint, readOnlyEndpoint]);

    expect(hot.getCellMeta(2, 0).readOnly).toBe(true);
    expect(hot.getPlugin('columnSummary').isLockedSummaryCell(2, 0)).toBe(true);
  });

  it('leaves a `readOnly: false` summary and a plain cell toggleable', () => {
    hot = buildGrid();

    hot.setCellMeta(2, 1, 'readOnly', true);
    hot.setCellMeta(0, 0, 'readOnly', true);

    expect(hot.getCellMeta(2, 1).readOnly).toBe(true);
    expect(hot.getCellMeta(0, 0).readOnly).toBe(true);

    hot.setCellMeta(2, 1, 'readOnly', false);
    hot.setCellMeta(0, 0, 'readOnly', false);

    expect(hot.getCellMeta(2, 1).readOnly).toBe(false);
    expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
  });

  it('moves the lock with a `reversedRowCoords` destination when a row is appended', async() => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[10], [20], [null]],
      columnSummary: [
        { destinationColumn: 0, destinationRow: 0, reversedRowCoords: true, ranges: [[0, 1]], type: 'sum' },
      ],
    });

    const plugin = hot.getPlugin('columnSummary');

    expect(plugin.isLockedSummaryCell(2, 0)).toBe(true);

    await hot.alter('insert_row_below', 2);

    expect(plugin.isLockedSummaryCell(3, 0)).toBe(true);
    // The vacated anchor is an ordinary cell again.
    expect(plugin.isLockedSummaryCell(2, 0)).toBe(false);

    hot.setCellMeta(2, 0, 'readOnly', true);
    hot.setCellMeta(2, 0, 'readOnly', false);

    expect(hot.getCellMeta(2, 0).readOnly).toBe(false);
  });

  it('keeps the lock on a summary row trimmed after its meta was already written', () => {
    // The summary writes its `readOnly` + `columnSummaryResult` meta only while its destination is
    // visible (`setEndpointValue` skips a trimmed one entirely - see AGENTS.md). So this starts
    // visible, lets that write happen, and trims row 2 afterward - matching a cell whose lock must
    // survive a LATER trim, not one that starts trimmed and never gets written to at all.
    hot = buildGrid({ trimRows: true });

    expect(hot.getPlugin('columnSummary').isLockedSummaryCell(2, 0)).toBe(true);

    hot.getPlugin('trimRows').trimRow(2);

    // With row 2 trimmed, `countRows()` is 2 - row 2 is past that count, so both `setCellMeta` and
    // `isLockedSummaryCell` must treat it as an already-physical index, the same fallback
    // `core.ts` uses, or the lock silently stops applying while the row stays trimmed.
    expect(hot.getPlugin('columnSummary').isLockedSummaryCell(2, 0)).toBe(true);

    hot.setCellMeta(2, 0, 'readOnly', false);

    expect(hot.getCellMeta(2, 0).readOnly).toBe(true);

    hot.getPlugin('trimRows').untrimAll();

    expect(hot.getCellMeta(2, 0).readOnly).toBe(true);
  });

  it('vetoes redo writing `true` over an already-locked cell, so it is never recorded user-defined', () => {
    // Redo of a "make read-only" column toggle writes `readOnly: true` over the whole captured
    // range through public `setCellMeta`, the summary cell included even though it was already
    // locked. Unlike `_setCellMetaDeclarative`, a public write that gets through is recorded as
    // user-defined meta - which would outlive the endpoint if the summary later moved. Vetoing
    // every value, not only a falsy one, keeps that write from landing at all.
    hot = buildGrid();

    const afterSetCellMeta = jest.fn();

    hot.addHook('afterSetCellMeta', afterSetCellMeta);
    hot.setCellMeta(2, 0, 'readOnly', true);

    expect(hot.getCellMeta(2, 0).readOnly).toBe(true);
    expect(afterSetCellMeta).not.toHaveBeenCalled();
  });

  it('does not report a plain cell moved into the summary\'s configured column as locked', () => {
    // The lock's cache is keyed by `destinationColumn` as configured and is not re-keyed when a
    // column moves (no `afterColumnMove` refresh - see AGENTS.md). Moving column 2 (no summary at
    // all) to the front leaves a stale cache entry naming column 0 as locked, over a cell that
    // carries neither the summary's `readOnly` flag nor its `columnSummaryResult` class; that plain
    // cell must never read as locked just because the cache still names its column.
    hot = buildGrid({ manualColumnMove: true });

    expect(hot.getPlugin('columnSummary').isLockedSummaryCell(2, 0)).toBe(true);

    hot.getPlugin('manualColumnMove').moveColumn(2, 0);
    hot.render();

    expect(hot.getPlugin('columnSummary').isLockedSummaryCell(2, 0)).toBe(false);

    hot.setCellMeta(2, 0, 'readOnly', true);
    hot.setCellMeta(2, 0, 'readOnly', false);

    expect(hot.getCellMeta(2, 0).readOnly).toBe(false);
  });

  it('releases the lock once the plugin is disabled', () => {
    hot = buildGrid();

    hot.updateSettings({ columnSummary: false });

    expect(hot.getPlugin('columnSummary').isLockedSummaryCell(2, 0)).toBe(false);

    hot.setCellMeta(2, 0, 'readOnly', false);

    expect(hot.getCellMeta(2, 0).readOnly).toBe(false);
  });
});
