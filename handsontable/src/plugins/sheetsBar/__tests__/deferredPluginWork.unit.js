import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

/**
 * Plugins whose data-dependent work `Core#_applySettingsAndData()` holds back for their
 * `onDataReady()` step, exercised through the call the sheets bar makes on every switch.
 */
describe('plugins applied ahead of their data', () => {
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

  it('keeps a declared Pagination page that the previous data was too short for', () => {
    hot = new Handsontable(container, { data: [[1]], licenseKey: LICENSE_KEY });

    hot._applySettingsAndData(
      { pagination: { pageSize: 2, initialPage: 3 } },
      Array.from({ length: 10 }, (_, row) => [row]),
      'test',
    );

    expect(hot.getPlugin('pagination').enabled).toBe(true);
    expect(hot.getPlugin('pagination').getCurrentPage()).toBe(3);
  });

  it('shows the empty state only when the new data is empty, never for the rows the grid held', () => {
    const shown = jest.fn();

    hot = new Handsontable(container, { data: [], afterEmptyDataStateShow: shown, licenseKey: LICENSE_KEY });

    hot._applySettingsAndData({ emptyDataState: true }, [[1], [2]], 'test');

    expect(shown).not.toHaveBeenCalled();
    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(false);

    hot._applySettingsAndData({ emptyDataState: { message: 'Nothing here' } }, [], 'test');

    expect(shown).toHaveBeenCalledTimes(1);
    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);
  });

  it('applies a ColumnSummary to the new rows without writing into the rows the grid held', () => {
    const departing = [['Draft'], ['Final'], ['Keep me']];
    const arriving = [[1], [2], [null]];

    hot = new Handsontable(container, { data: departing, licenseKey: LICENSE_KEY });

    hot._applySettingsAndData({
      columnSummary: [{ sourceColumn: 0, destinationRow: 2, destinationColumn: 0, type: 'sum', ranges: [[0, 1]] }],
    }, arriving, 'test');

    expect(departing[2][0]).toBe('Keep me');
    expect(hot.getDataAtCell(2, 0)).toBe(3);
  });
});
