import Handsontable from 'handsontable/base';
import { registerPlugin, ColumnSummary } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(ColumnSummary);

/**
 * DEV-144: an endpoint declared with `reversedRowCoords: true` is anchored to the BOTTOM of the
 * table, so appending a row past the current last row must move the summary down onto the new last
 * row. The endpoint's destination is resolved once at parse time and only shifted when the
 * alteration index sits at or before it, so an append below the anchor left the summary parked on
 * the old last row (issue #129, reproduced on 15.0.0).
 */
describe('ColumnSummary reversedRowCoords with alter()', () => {
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
   * Builds a grid whose only column holds two data rows and a reversed summary anchored to the
   * last row.
   *
   * @param {object} [extraEndpoint] An additional endpoint to declare alongside the reversed one.
   * @returns {Handsontable} The created instance.
   */
  function buildGrid(extraEndpoint) {
    const columnSummary = [{
      destinationColumn: 0,
      destinationRow: 0,
      reversedRowCoords: true,
      ranges: [[0, 1]],
      type: 'sum',
    }];

    if (extraEndpoint) {
      columnSummary.push(extraEndpoint);
    }

    return new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[10, 1], [20, 2], [null, null]],
      columnSummary,
    });
  }

  it('moves the summary onto the new last row when a row is appended with an explicit index', async() => {
    hot = buildGrid();

    // Premise: the summary sits on the last (third) row before the alteration.
    expect(hot.getDataAtCell(2, 0)).toBe(30);

    await hot.alter('insert_row_below', 2);

    // The summary follows the bottom onto the new last row, and the old anchor is cleared.
    expect(hot.getDataAtCell(3, 0)).toBe(30);
    expect(hot.getCellMeta(3, 0).readOnly).toBe(true);
    expect(hot.getCellMeta(3, 0).className).toContain('columnSummaryResult');
    // `''` (not `null`) proves the reset actually wrote the old anchor blank — the seed value there
    // was `null`, so `null` would mean the clear never ran.
    expect(hot.getDataAtCell(2, 0)).toBe('');
  });

  it('moves the summary onto the new last row when a row is appended without an index', async() => {
    hot = buildGrid();

    expect(hot.getDataAtCell(2, 0)).toBe(30);

    await hot.alter('insert_row_below');

    expect(hot.getDataAtCell(3, 0)).toBe(30);
    expect(hot.getCellMeta(3, 0).readOnly).toBe(true);
    expect(hot.getCellMeta(3, 0).className).toContain('columnSummaryResult');
    expect(hot.getDataAtCell(2, 0)).toBe('');
  });

  it('keeps the summary on the last row when a row is inserted above the anchor', async() => {
    hot = buildGrid();

    expect(hot.getDataAtCell(2, 0)).toBe(30);

    await hot.alter('insert_row_above', 0);

    // A blank row is pushed in at the top; the reversed summary stays anchored to the last row.
    expect(hot.getDataAtCell(3, 0)).toBe(30);
    expect(hot.getCellMeta(3, 0).readOnly).toBe(true);
    expect(hot.getCellMeta(3, 0).className).toContain('columnSummaryResult');
  });

  it('re-anchors within maxRows when an appended row is still addressable', async() => {
    // `maxRows` caps `countAddressableRows()` but not `countPhysicalRows()`. `alter` never creates a
    // row past `maxRows`, so an append that stays within the cap must land the summary on the new
    // last row rather than tripping the out-of-bounds guard.
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[10], [20], [null]],
      maxRows: 4,
      columnSummary: [{
        destinationColumn: 0,
        destinationRow: 0,
        reversedRowCoords: true,
        ranges: [[0, 1]],
        type: 'sum',
      }],
    });

    expect(hot.getDataAtCell(2, 0)).toBe(30);

    await hot.alter('insert_row_below', 2);

    expect(hot.countRows()).toBe(4);
    expect(hot.getDataAtCell(3, 0)).toBe(30);
    expect(hot.getCellMeta(3, 0).className).toContain('columnSummaryResult');
  });

  it('does not move a non-reversed endpoint when a row is appended below it', async() => {
    // The extra endpoint targets a fixed physical row in the second column and must stay put; only
    // the reversed one (first column) tracks the bottom.
    hot = buildGrid({
      destinationColumn: 1,
      destinationRow: 0,
      ranges: [[1, 1]],
      type: 'sum',
    });

    // The fixed endpoint writes its result (sum of row 1 in column 1 = 2) to physical row 0.
    expect(hot.getDataAtCell(0, 1)).toBe(2);

    await hot.alter('insert_row_below', 2);

    // The fixed endpoint stays on physical row 0; the reversed one has moved to the new last row.
    expect(hot.getDataAtCell(0, 1)).toBe(2);
    expect(hot.getDataAtCell(3, 0)).toBe(30);
  });
});
