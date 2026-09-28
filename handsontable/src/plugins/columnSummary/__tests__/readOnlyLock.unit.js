import Handsontable from 'handsontable/base';
import { registerPlugin, ColumnSummary } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(ColumnSummary);

/**
 * DEV-148: the plugin owns the `readOnly` state of a read-only summary cell. A `setCellMeta` that
 * would make one writable is vetoed - the path the "Read only" menu item, its undo, and its redo all
 * write through. A summary configured `readOnly: false` is not locked.
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

    // Any other key still goes through, and so does a write that keeps the cell read-only.
    hot.setCellMeta(2, 0, 'placeholder', 'total');
    hot.setCellMeta(2, 0, 'readOnly', true);

    expect(hot.getCellMeta(2, 0).placeholder).toBe('total');
    expect(hot.getCellMeta(2, 0).readOnly).toBe(true);
    expect(afterSetCellMeta).toHaveBeenCalledTimes(2);
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

  it('releases the lock once the plugin is disabled', () => {
    hot = buildGrid();

    hot.updateSettings({ columnSummary: false });

    expect(hot.getPlugin('columnSummary').isLockedSummaryCell(2, 0)).toBe(false);

    hot.setCellMeta(2, 0, 'readOnly', false);

    expect(hot.getCellMeta(2, 0).readOnly).toBe(false);
  });
});
