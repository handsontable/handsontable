import Handsontable from 'handsontable/base';
import { registerPlugin } from 'handsontable/plugins';
import { BindRowsWithHeaders } from 'handsontable/plugins/bindRowsWithHeaders';
import { ManualRowMove } from 'handsontable/plugins/manualRowMove';

registerPlugin(BindRowsWithHeaders);
registerPlugin(ManualRowMove);

/**
 * The `'strict'` strategy numbers an inserted row past the highest number, and a data load renumbers every
 * row by its physical index. `_exportStrictHeaders()` and `_importStrictHeaders()` carry the numbers across
 * such a load.
 */
describe('BindRowsWithHeaders -> strict header numbers across a data load', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a grid of four rows with the given strategy.
   *
   * @param {string|boolean} strategy The `bindRowsWithHeaders` value.
   * @returns {object} The plugin.
   */
  function buildGrid(strategy) {
    hot = new Handsontable(container, {
      data: [['a'], ['b'], ['c'], ['d']],
      rowHeaders: true,
      manualRowMove: true,
      bindRowsWithHeaders: strategy,
      licenseKey: 'non-commercial-and-evaluation',
    });

    return hot.getPlugin('bindRowsWithHeaders');
  }

  /**
   * Reads the row headers of every visual row.
   *
   * @returns {Array}
   */
  function rowHeaders() {
    return Array.from({ length: hot.countRows() }, (_, row) => hot.getRowHeader(row));
  }

  it('puts back the numbers of inserted rows after a data load', () => {
    const plugin = buildGrid('strict');

    hot.alter('insert_row_above', 0, 1);

    const exported = plugin._exportStrictHeaders();
    const headers = rowHeaders();

    expect(headers).toEqual([5, 1, 2, 3, 4]);

    hot.loadData([['x'], ['a'], ['b'], ['c'], ['d']]);

    expect(rowHeaders()).toEqual([1, 2, 3, 4, 5]);
    expect(plugin._importStrictHeaders(exported)).toBe(true);

    hot.render();

    expect(rowHeaders()).toEqual(headers);
  });

  it('returns a copy, so a later insert does not change the exported numbers', () => {
    const plugin = buildGrid('strict');
    const exported = plugin._exportStrictHeaders();

    hot.alter('insert_row_above', 0, 1);

    expect(exported).toEqual([0, 1, 2, 3]);
  });

  it('writes nothing when the numbers do not cover every row', () => {
    const plugin = buildGrid('strict');

    hot.alter('insert_row_above', 0, 1);

    const exported = plugin._exportStrictHeaders();

    hot.loadData([['a'], ['b'], ['c'], ['d']]);

    expect(plugin._importStrictHeaders(exported)).toBe(false);
    expect(rowHeaders()).toEqual([1, 2, 3, 4]);
  });

  it('exports nothing and writes nothing with the loose strategy', () => {
    const plugin = buildGrid(true);

    expect(plugin._exportStrictHeaders()).toBeNull();
    expect(plugin._importStrictHeaders([3, 2, 1, 0])).toBe(false);
    expect(rowHeaders()).toEqual([1, 2, 3, 4]);
  });
});
