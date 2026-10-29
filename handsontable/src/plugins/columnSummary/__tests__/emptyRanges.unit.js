import Handsontable from 'handsontable/base';
import { registerPlugin, ColumnSummary } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(ColumnSummary);

/**
 * An endpoint declared with `ranges: []` summarizes no rows. It used to throw while the grid was
 * built, because the empty array left the endpoint without any `ranges` to iterate.
 */
describe('ColumnSummary with `ranges: []`', () => {
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
   * Builds a grid with one summary of the given type on the first row and an empty range.
   *
   * @param {string} type The summary type.
   * @returns {Handsontable} The created instance.
   */
  function buildGrid(type) {
    return new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[null], [10], [20]],
      columnSummary: [{ destinationColumn: 0, destinationRow: 0, type, ranges: [] }],
    });
  }

  it.each([
    ['sum', 0],
    ['count', 0],
    ['min', 'Not enough data'],
    ['max', 'Not enough data'],
    ['average', 'Not enough data'],
  ])('shows the empty result for `%s`', (type, expected) => {
    hot = buildGrid(type);

    expect(hot.getDataAtCell(0, 0)).toBe(expected);
  });

  it('keeps summarizing no rows after a row is added and removed', async() => {
    hot = buildGrid('sum');

    await hot.alter('insert_row_above', 1);
    hot.setDataAtCell(1, 0, 5);

    expect(hot.getDataAtCell(0, 0)).toBe(0);

    await hot.alter('remove_row', 1);

    expect(hot.getDataAtCell(0, 0)).toBe(0);
  });

  it('exports the empty range as `[]`', () => {
    hot = buildGrid('sum');

    expect(hot.getPlugin('columnSummary').exportEndpointSettings()[0].ranges).toEqual([]);
  });
});
