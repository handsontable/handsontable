import Handsontable from 'handsontable/base';
import { registerPlugin, ColumnSummary } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(ColumnSummary);

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

  it('caps the re-derived range at `maxRows`', async() => {
    hot = buildGrid(
      [{ destinationColumn: 0, destinationRow: 0, type: 'sum' }],
      [[null], [10], [20]],
      { maxRows: 4 }
    );

    await hot.alter('insert_row_below');
    await hot.alter('insert_row_below');

    expect(hot.countRows()).toBe(4);
    expect(hot.getDataAtCell(0, 0)).toBe(30);
  });
});
