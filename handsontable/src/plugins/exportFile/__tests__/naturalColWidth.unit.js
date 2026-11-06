import Core from 'handsontable/core';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';
import DataProvider from '../dataProvider';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);

describe('DataProvider#_getNaturalColWidth', () => {
  let container;
  let hot;

  /**
   * Builds a three-column grid whose first column is moved to the end.
   *
   * @param {object} settings The grid settings.
   * @returns {DataProvider}
   */
  function createProvider(settings) {
    hot = new Core(container, {
      licenseKey: TEST_LICENSE_KEY,
      // A raw `Core` is not a root instance, so no default theme is picked for it; name one.
      themeName: 'ht-theme-main',
      data: [['a', 'b', 'c']],
      autoColumnSize: false,
      ...settings,
    });
    hot.init();
    hot.columnIndexMapper.moveIndexes([0], 2);

    return new DataProvider(hot);
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('should read an array `colWidths` by the physical column index', () => {
    const provider = createProvider({ colWidths: [100, 120, 140] });

    expect(provider._getNaturalColWidth(0)).toBe(120);
    expect(provider._getNaturalColWidth(1)).toBe(140);
    expect(provider._getNaturalColWidth(2)).toBe(100);
  });

  it('should call a `colWidths` function with the physical column index', () => {
    const provider = createProvider({ colWidths: physical => (physical + 1) * 10 });

    expect(provider._getNaturalColWidth(0)).toBe(20);
    expect(provider._getNaturalColWidth(2)).toBe(10);
  });

  it('should read a string `colWidths`', () => {
    const provider = createProvider({ colWidths: '120px' });

    expect(provider._getNaturalColWidth(1)).toBe(120);
  });

  it('should fall back to the default column width when `colWidths` has no entry', () => {
    const provider = createProvider({ colWidths: [100], defaultColumnWidth: 70 });

    expect(provider._getNaturalColWidth(0)).toBe(70);
  });

  it('should keep a `columns[].width` with its column after the move', () => {
    const provider = createProvider({ columns: [{ width: 200 }, {}, {}] });

    expect(provider._getNaturalColWidth(2)).toBe(200);
    expect(provider._getNaturalColWidth(0)).toBe(50);
  });

  it('should fall back to the default column width for a `colWidths` that is not a number', () => {
    const provider = createProvider({ colWidths: 'auto', defaultColumnWidth: 70 });

    expect(provider._getNaturalColWidth(0)).toBe(70);
  });
});
