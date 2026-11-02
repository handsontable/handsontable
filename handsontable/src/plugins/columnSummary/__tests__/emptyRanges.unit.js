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
   * Builds a grid with the summary on the first row and two data rows below it.
   *
   * @param {object[]|Function} columnSummary The endpoints to declare.
   * @returns {Handsontable} The created instance.
   */
  function buildGrid(columnSummary) {
    return new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[null], [10], [20]],
      columnSummary,
    });
  }

  /**
   * Returns one endpoint with the summary on the first row.
   *
   * @param {object} config The endpoint options to add.
   * @returns {object} The endpoint.
   */
  function endpoint(config) {
    return { destinationColumn: 0, destinationRow: 0, ...config };
  }

  it.each([
    ['sum', 0],
    ['count', 0],
    ['min', 'Not enough data'],
    ['max', 'Not enough data'],
    ['average', 'Not enough data'],
  ])('shows the empty result for `%s`', (type, expected) => {
    hot = buildGrid([endpoint({ type, ranges: [] })]);

    expect(hot.getDataAtCell(0, 0)).toBe(expected);
  });

  it('hands a `custom` function an empty `ranges` array', () => {
    let receivedRanges;

    hot = buildGrid([endpoint({
      type: 'custom',
      ranges: [],
      customFunction(summaryEndpoint) {
        receivedRanges = summaryEndpoint.ranges;

        return 7;
      },
    })]);

    expect(receivedRanges).toEqual([]);
    expect(hot.getDataAtCell(0, 0)).toBe(7);
  });

  it('summarizes no rows when the settings are a function', () => {
    hot = buildGrid(() => [endpoint({ type: 'sum', ranges: [] })]);

    expect(hot.getDataAtCell(0, 0)).toBe(0);
  });

  it('summarizes no rows after `updateSettings()`', async() => {
    hot = buildGrid([endpoint({ type: 'sum' })]);

    expect(hot.getDataAtCell(0, 0)).toBe(30);

    await hot.updateSettings({ columnSummary: [endpoint({ type: 'sum', ranges: [] })] });

    expect(hot.getDataAtCell(0, 0)).toBe(0);
  });

  it('keeps summarizing no rows after a row is added and removed', async() => {
    hot = buildGrid([endpoint({ type: 'sum', ranges: [] })]);

    await hot.alter('insert_row_above', 1);
    hot.setDataAtCell(1, 0, 5);

    expect(hot.getDataAtCell(0, 0)).toBe(0);

    await hot.alter('remove_row', 1);

    expect(hot.getDataAtCell(0, 0)).toBe(0);
  });

  it('summarizes the whole column when `ranges` is not an array', async() => {
    hot = buildGrid([endpoint({ type: 'sum', ranges: null })]);

    expect(hot.getDataAtCell(0, 0)).toBe(30);

    await hot.alter('insert_row_below', 2);
    hot.setDataAtCell(3, 0, 5);

    expect(hot.getDataAtCell(0, 0)).toBe(35);
  });
});
