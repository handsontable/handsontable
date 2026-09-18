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
 * the old last row (DEV-144, reproduced on 15.0.0).
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
    // The vacated cell must lose its summary styling too, or it stays uneditable and keeps counting
    // as a summary result.
    expect(hot.getCellMeta(2, 0).readOnly).toBe(false);
    expect(hot.getCellMeta(2, 0).className || '').not.toContain('columnSummaryResult');
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

  it('re-derives a non-last reversed anchor when a row is appended, using the stored offset', async() => {
    // `destinationRow: 1` anchors the summary to the SECOND row from the bottom, so the arithmetic
    // must use the offset (1), not a bare `count - 1`. With four rows the anchor resolves to row 2.
    // Row 3 seeds real data so the assertions discriminate WHERE the summary lands, not just that a
    // null became a number.
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[10], [20], [null], [99]],
      columnSummary: [{
        destinationColumn: 0,
        destinationRow: 1,
        reversedRowCoords: true,
        ranges: [[0, 0]],
        type: 'sum',
      }],
    });

    // Second row from the bottom of four rows is row 2; the range sums only row 0 (= 10).
    expect(hot.getDataAtCell(2, 0)).toBe(10);

    await hot.alter('insert_row_below', 3);

    // Five rows now; second from the bottom is row 3. `count - offset - 1` = 5 - 1 - 1 = 3. That row
    // held 99 — an APPEND re-anchoring onto data is by design (it mirrors the initial parse planting
    // the anchor on the reversed slot), so the summary correctly overwrites it.
    expect(hot.getDataAtCell(3, 0)).toBe(10);
    expect(hot.getCellMeta(3, 0).className).toContain('columnSummaryResult');
    // The old anchor (row 2) is cleared, and the untouched data row 0 survives.
    expect(hot.getDataAtCell(2, 0)).toBe('');
    expect(hot.getDataAtCell(0, 0)).toBe(10);
  });

  it('does not overwrite user data when a removal would re-anchor a reversed summary onto it', async() => {
    // `destinationRow: 1` = second row from the bottom. With four rows the anchor is row 2 (its
    // seeded 30 is replaced by the summary at parse time). Removing the last row shrinks the table so
    // the reversed anchor would re-derive onto row 1, which holds real data (20). Moving there would
    // overwrite it — the regression this guards against — so the endpoint stays parked instead.
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[10], [20], [30], [40]],
      columnSummary: [{
        destinationColumn: 0,
        destinationRow: 1,
        reversedRowCoords: true,
        ranges: [[0, 0]],
        type: 'sum',
      }],
    });

    // Anchor at row 2 = sum of row 0 = 10; row 1 holds the user's 20.
    expect(hot.getDataAtCell(2, 0)).toBe(10);
    expect(hot.getDataAtCell(1, 0)).toBe(20);

    await hot.alter('remove_row', 3);

    // The user's data on row 1 must survive; the summary stays where it was rather than clobbering it.
    expect(hot.getDataAtCell(1, 0)).toBe(20);
    expect(hot.getDataAtCell(2, 0)).toBe(10);
    expect(hot.getCellMeta(2, 0).className).toContain('columnSummaryResult');
  });

  it('re-anchors several reversed endpoints together when a row is appended', async() => {
    // Two reversed endpoints, one per column. Both must re-anchor; this also exercises the
    // `resetAllEndpoints` all-or-nothing bounds check across more than one endpoint.
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[10, 1], [20, 2], [null, null]],
      columnSummary: [
        { destinationColumn: 0, destinationRow: 0, reversedRowCoords: true, ranges: [[0, 1]], type: 'sum' },
        { destinationColumn: 1, destinationRow: 0, reversedRowCoords: true, ranges: [[0, 1]], type: 'sum' },
      ],
    });

    expect(hot.getDataAtCell(2, 0)).toBe(30);
    expect(hot.getDataAtCell(2, 1)).toBe(3);

    await hot.alter('insert_row_below', 2);

    expect(hot.getDataAtCell(3, 0)).toBe(30);
    expect(hot.getDataAtCell(3, 1)).toBe(3);
  });

  it('warns instead of silently vanishing when removals push a reversed anchor below zero', async() => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Offset 2 on four rows resolves to row 1. Removing three rows leaves one, where
    // `count - offset - 1` = 1 - 2 - 1 = -2, i.e. out of bounds.
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[10], [20], [30], [40]],
      columnSummary: [{
        destinationColumn: 0,
        destinationRow: 2,
        reversedRowCoords: true,
        ranges: [[0, 0]],
        type: 'sum',
      }],
    });

    expect(hot.getDataAtCell(1, 0)).toBe(10);

    warnSpy.mockClear();
    await hot.alter('remove_row', 1, 3);

    expect(hot.countRows()).toBe(1);
    // The out-of-bounds warning fires rather than the summary disappearing with nothing logged.
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('clears a moved sibling anchor on a later alteration after another endpoint parked below zero', async() => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Endpoint A (column 0, offset 0) tracks the last row. Endpoint B (column 1, offset 4) drops below
    // zero after the first removal and stays parked with a negative destination. The poison this
    // guards against only shows on a LATER alteration: if B's negative index were caught by the
    // all-or-nothing bounds check in `resetAllEndpoints`, it would skip clearing every endpoint —
    // including A's vacated cell when A re-anchors on the append below.
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[1, 10], [2, 20], [3, 30], [4, 40], [5, 50], [6, 60]],
      columnSummary: [
        { destinationColumn: 0, destinationRow: 0, reversedRowCoords: true, ranges: [[4, 4]], type: 'sum' },
        { destinationColumn: 1, destinationRow: 4, reversedRowCoords: true, ranges: [[5, 5]], type: 'sum' },
      ],
    });

    // Step 1: shrink the table so B re-derives to 4 - 4 - 1 = -1 and parks (with a warning), while A
    // stays valid on the new last row.
    await hot.alter('remove_row', 0, 2);
    expect(warnSpy).toHaveBeenCalled();

    const aRowBefore = hot.countRows() - 1;

    // Step 2: append. A re-anchors from `aRowBefore` to the new last row; its old cell must be cleared.
    // With the poison, B's parked negative would skip that clear and leave a stale summary behind.
    warnSpy.mockClear();
    await hot.alter('insert_row_below');

    const aRowAfter = hot.countRows() - 1;

    expect(aRowAfter).toBe(aRowBefore + 1);
    expect(hot.getCellMeta(aRowAfter, 0).className).toContain('columnSummaryResult');

    // The discriminator: A's previous cell holds no stale summary value.
    const vacated = hot.getDataAtCell(aRowBefore, 0);

    expect(vacated === '' || vacated === null).toBe(true);

    warnSpy.mockRestore();
  });

  it('moves a reversed summary onto the new last row when a row is removed', async() => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[10], [20], [30], [null]],
      columnSummary: [{
        destinationColumn: 0,
        destinationRow: 0,
        reversedRowCoords: true,
        ranges: [[1, 2]],
        type: 'sum',
      }],
    });

    // Last row of four holds the summary (sum of rows 1-2 = 50).
    expect(hot.getDataAtCell(3, 0)).toBe(50);

    // Remove the first row, which sits above both the range and the anchor.
    await hot.alter('remove_row', 0);

    // Three rows left; the range follows to rows 0-1 (= 20 + 30) and the summary follows the bottom
    // onto the new last row.
    expect(hot.getDataAtCell(2, 0)).toBe(50);
    expect(hot.getCellMeta(2, 0).readOnly).toBe(true);
    expect(hot.getCellMeta(2, 0).className).toContain('columnSummaryResult');
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
