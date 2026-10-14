import Core from 'handsontable/core';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';

registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);

describe('colWidths addressed by physical column index', () => {
  let container;
  let hot;

  /**
   * Builds and initializes a three-column grid in the shared container.
   *
   * @param {object} settings The grid settings.
   * @returns {Core}
   */
  function createGrid(settings) {
    hot = new Core(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [['a', 'b', 'c']],
      autoColumnSize: false,
      ...settings,
    });
    hot.init();

    return hot;
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

  it('should keep an array width with its column after the column is moved', () => {
    createGrid({ colWidths: [100, 120, 140] });

    hot.columnIndexMapper.moveIndexes([0], 2);

    // visual order is now [1, 2, 0]
    expect(hot.getColWidth(0)).toBe(120);
    expect(hot.getColWidth(1)).toBe(140);
    expect(hot.getColWidth(2)).toBe(100);
  });

  it('should call the `colWidths` function with the physical index', () => {
    const colWidths = jasmine.createSpy('colWidths').and.callFake(physical => (physical + 1) * 10);

    createGrid({ colWidths });

    hot.columnIndexMapper.moveIndexes([0], 2);

    expect(hot.getColWidth(0)).toBe(20);
    expect(hot.getColWidth(2)).toBe(10);
  });

  it('should keep a `columns[].width` with its column after the column is moved', () => {
    createGrid({ columns: [{ width: 100 }, { width: 120 }, { width: 140 }] });

    hot.columnIndexMapper.moveIndexes([0], 2);

    expect(hot.getColWidth(0)).toBe(120);
    expect(hot.getColWidth(2)).toBe(100);
  });

  it('should not read the array for a header or a column outside the grid', () => {
    createGrid({ colWidths: [100, 120, 140] });

    expect(hot._getColWidthFromSettings(-1)).toBeUndefined();
    expect(hot._getColWidthFromSettings(3)).toBeUndefined();
  });

  it('should leave the width untouched when no column is moved', () => {
    createGrid({ colWidths: [100, 120, 140] });

    expect(hot.getColWidth(0)).toBe(100);
    expect(hot.getColWidth(1)).toBe(120);
    expect(hot.getColWidth(2)).toBe(140);
  });

  it('should still apply a number and a string width to every column', () => {
    createGrid({ colWidths: 80 });

    expect(hot.getColWidth(1)).toBe(80);

    hot.updateSettings({ colWidths: '90px' });

    expect(hot.getColWidth(1)).toBe(90);
  });
});
