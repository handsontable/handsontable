import Handsontable from 'handsontable/base';
import { registerPlugin, HiddenColumns } from 'handsontable/plugins';

registerPlugin(HiddenColumns);

/**
 * Builds a 10 column grid with the last two columns frozen at the inline end.
 *
 * @param {object} [settings] Extra settings.
 * @returns {Handsontable} The instance.
 */
function buildGrid(settings = {}) {
  return new Handsontable(document.createElement('div'), {
    data: [Array.from({ length: 10 }, (_, c) => `C${c}`)],
    fixedColumnsEnd: 2,
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });
}

describe('fixedColumnsEnd with hidden and trimmed columns', () => {
  it('should keep the slot of a hidden column, so the drawn band shrinks', () => {
    const hot = buildGrid({ hiddenColumns: { columns: [9] } });

    // The band is still the last two visual columns (8 and 9) ...
    expect(hot.view.countFixedColumnsEnd()).toBe(2);
    // ... and the column 9 is hidden, so only the column 8 is drawn in it.
    expect(hot.view.countNotHiddenFixedColumnsEnd()).toBe(1);

    hot.destroy();
  });

  it('should let the next column move into the band when a column is trimmed', () => {
    const hot = buildGrid();
    const trimmingMap = hot.columnIndexMapper.createAndRegisterIndexMap('test-trim', 'trimming');

    trimmingMap.setValueAtIndex(9, true);

    // The trimmed column left the visual space: the band is the last two columns that remain (7 and 8)
    // and it still draws two columns.
    expect(hot.countCols()).toBe(9);
    expect(hot.view.countFixedColumnsEnd()).toBe(2);
    expect(hot.view.countNotHiddenFixedColumnsEnd()).toBe(2);

    hot.destroy();
  });
});
