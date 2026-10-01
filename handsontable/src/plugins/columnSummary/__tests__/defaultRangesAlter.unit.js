import Handsontable from 'handsontable/base';
import { registerPlugin, ColumnSummary, TrimRows } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(ColumnSummary);
registerPlugin(TrimRows);

/**
 * DEV-2995: an endpoint that declares no `ranges` gets the default `[[0, count - 1]]`. That default
 * was resolved once at parse time and only shifted by the alteration, so a row appended past the
 * last row stayed outside the summed range. The default must follow the table, while an explicit
 * range must never grow.
 */
describe('ColumnSummary default ranges with alter()', () => {
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
   * Builds a grid with the summary on the first row and two data rows below it.
   *
   * @param {object[]} columnSummary The endpoints to declare.
   * @param {Array[]} [data] The grid data.
   * @param {object} [extraSettings] Additional grid settings.
   * @returns {Handsontable} The created instance.
   */
  function buildGrid(columnSummary, data = [[null], [10], [20]], extraSettings = {}) {
    return new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data,
      columnSummary,
      ...extraSettings,
    });
  }

  it('sums a row appended past the last row', async() => {
    hot = buildGrid([{ destinationColumn: 0, destinationRow: 0, type: 'sum' }]);

    expect(hot.getDataAtCell(0, 0)).toBe(30);

    await hot.alter('insert_row_below');
    hot.setDataAtCell(3, 0, 5);

    expect(hot.getDataAtCell(0, 0)).toBe(35);
  });

  it('keeps following the table across several appends', async() => {
    hot = buildGrid([{ destinationColumn: 0, destinationRow: 0, type: 'sum' }]);

    await hot.alter('insert_row_below');
    await hot.alter('insert_row_below');
    hot.setDataAtCell(3, 0, 5);
    hot.setDataAtCell(4, 0, 7);

    expect(hot.getDataAtCell(0, 0)).toBe(42);
  });

  it('sums a row appended below a reversed summary (the ticket repro)', async() => {
    hot = buildGrid(
      [{ destinationColumn: 0, destinationRow: 0, reversedRowCoords: true, type: 'sum' }],
      [[10], [20], [null]]
    );

    expect(hot.getDataAtCell(2, 0)).toBe(30);

    await hot.alter('insert_row_below');
    await hot.alter('insert_row_below');
    // The summary now sits on row 4; row 3 is plain data the old range would have left out.
    hot.setDataAtCell(3, 0, 5);

    expect(hot.getDataAtCell(4, 0)).toBe(35);
  });

  it('sums a row inserted inside the range', async() => {
    hot = buildGrid([{ destinationColumn: 0, destinationRow: 0, type: 'sum' }]);

    await hot.alter('insert_row_above', 2);
    hot.setDataAtCell(2, 0, 5);

    expect(hot.getDataAtCell(0, 0)).toBe(35);
  });

  it('sums a row inserted above the first row', async() => {
    hot = buildGrid(
      [{ destinationColumn: 0, destinationRow: 2, type: 'sum' }],
      [[10], [20], [null]]
    );

    await hot.alter('insert_row_above', 0);
    hot.setDataAtCell(0, 0, 5);

    // The summary moved down with the shift; the default range covers the whole table.
    expect(hot.getDataAtCell(3, 0)).toBe(35);
  });

  it('shrinks the range when rows are removed', async() => {
    hot = buildGrid([{ destinationColumn: 0, destinationRow: 0, type: 'sum' }]);

    await hot.alter('remove_row', 2);

    expect(hot.getDataAtCell(0, 0)).toBe(10);

    await hot.alter('insert_row_below');
    hot.setDataAtCell(2, 0, 5);

    expect(hot.getDataAtCell(0, 0)).toBe(15);
  });

  it('does not grow an explicit range', async() => {
    hot = buildGrid([{ destinationColumn: 0, destinationRow: 0, ranges: [[1, 2]], type: 'sum' }]);

    expect(hot.getDataAtCell(0, 0)).toBe(30);

    await hot.alter('insert_row_below');
    hot.setDataAtCell(3, 0, 5);

    expect(hot.getDataAtCell(0, 0)).toBe(30);
  });

  it('grows only the endpoints that took the default', async() => {
    hot = buildGrid(
      [
        { destinationColumn: 0, destinationRow: 0, type: 'sum' },
        { destinationColumn: 1, destinationRow: 0, sourceColumn: 0, ranges: [[1, 2]], type: 'sum' },
      ],
      [[null, null], [10, null], [20, null]]
    );

    await hot.alter('insert_row_below');
    hot.setDataAtCell(3, 0, 5);

    expect(hot.getDataAtCell(0, 0)).toBe(35);
    expect(hot.getDataAtCell(0, 1)).toBe(30);
  });

  it('caps the re-derived range at `maxRows`, not at the physical row count', async() => {
    // Six physical rows with `maxRows: 4`: the default range is [0, 3], so rows 4 and 5 never count.
    hot = buildGrid(
      [{ destinationColumn: 0, destinationRow: 0, type: 'sum' }],
      [[null], [10], [20], [30], [40], [50]],
      { maxRows: 4 }
    );

    expect(hot.getDataAtCell(0, 0)).toBe(60);

    await hot.alter('remove_row', 1);

    // Develop shifts the end to 2 and sums 50. The cap gives [0, 3] over [null, 20, 30, 40] = 90, while the
    // physical count would give [0, 4] = 140.
    expect(hot.getDataAtCell(0, 0)).toBe(90);
  });

  it('follows a row appended by `minSpareRows`', async() => {
    hot = buildGrid(
      [{ destinationColumn: 0, destinationRow: 0, type: 'sum' }],
      [[null], [10], [20]],
      { minSpareRows: 1 }
    );

    expect(hot.countRows()).toBe(4);

    // Typing into the spare row appends the next spare row, and that one must be summed too.
    hot.setDataAtCell(3, 0, 5);
    hot.setDataAtCell(4, 0, 7);

    expect(hot.getDataAtCell(0, 0)).toBe(42);
  });

  it('keeps the summary intact when a column is inserted', async() => {
    hot = buildGrid([{ destinationColumn: 0, destinationRow: 0, type: 'sum' }], [[null, 1], [10, 2], [20, 3]]);

    await hot.alter('insert_col_end');
    hot.setDataAtCell(2, 0, 5);

    expect(hot.getDataAtCell(0, 0)).toBe(15);
  });

  it('counts hidden physical rows when rows are trimmed', async() => {
    hot = buildGrid(
      [{ destinationColumn: 0, destinationRow: 0, type: 'sum' }],
      [[null], [10], [20], [30]],
      { trimRows: [3] }
    );

    await hot.alter('insert_row_below');
    hot.setDataAtCell(hot.countRows() - 1, 0, 5);

    // Row 3 is trimmed and still belongs to the physical range; the typed row lands past it.
    expect(hot.getDataAtCell(0, 0)).toBe(65);
  });

  it('sums the new rows after `loadData()` replaces the data with a longer set', async() => {
    hot = buildGrid([{ destinationColumn: 0, destinationRow: 0, type: 'sum' }]);

    hot.loadData([[null], [1], [2], [3], [4], [5]]);

    expect(hot.getDataAtCell(0, 0)).toBe(15);
  });

  it('sums the new rows after `updateData()` replaces the data with a longer set', async() => {
    hot = buildGrid([{ destinationColumn: 0, destinationRow: 0, type: 'sum' }]);

    hot.updateData([[null], [1], [2], [3], [4], [5]]);

    expect(hot.getDataAtCell(0, 0)).toBe(15);
  });

  it('does not grow an explicit range after `loadData()`', async() => {
    hot = buildGrid([{ destinationColumn: 0, destinationRow: 0, ranges: [[1, 2]], type: 'sum' }]);

    hot.loadData([[null], [1], [2], [3], [4], [5]]);

    expect(hot.getDataAtCell(0, 0)).toBe(3);
  });

  it('leaves no range for an empty table instead of reading row -1', async() => {
    hot = buildGrid([{ destinationColumn: 0, destinationRow: 0, type: 'count' }]);

    const endpoint = hot.getPlugin('columnSummary').endpoints.getEndpoint(0);

    hot.getPlugin('columnSummary').endpoints.countAddressableRows = () => 0;
    hot.getPlugin('columnSummary').endpoints.refreshAllEndpoints();

    expect(endpoint.ranges).toEqual([]);
  });

  it('keeps a reversed summary on the spare row and still sums an edited row', async() => {
    hot = buildGrid(
      [{ destinationColumn: 0, destinationRow: 0, reversedRowCoords: true, type: 'sum' }],
      [[10], [20]],
      { minSpareRows: 1 }
    );

    // The summary starts on the spare row, which is the last row.
    expect(hot.getDataAtCell(2, 0)).toBe(30);

    hot.setDataAtCell(0, 0, 15);

    // A smoke test for the combination: the summary stays on the spare row and the edit is summed. It does not
    // pin range growth, because a row can only be appended below a reversed summary by writing into the
    // read-only summary row itself.
    expect(hot.getDataAtCell(2, 0)).toBe(35);
  });
});
