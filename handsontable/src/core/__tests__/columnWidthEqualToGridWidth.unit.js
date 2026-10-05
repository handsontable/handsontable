import Core from 'handsontable/core';
import { registerCellType, TextCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';

registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);

describe('Column width equal to the grid width (DEV-270)', () => {
  let container;
  let hot;

  /**
   * Builds and initializes a grid in the shared container.
   *
   * @param {object} settings The grid settings.
   * @returns {Core}
   */
  function createGrid(settings) {
    hot = new Core(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [['a', 'b']],
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

  it('should apply `columns[].width` that equals the grid `width`', () => {
    createGrid({ width: 300, columns: [{ width: 300 }, { width: 300 }] });

    expect(hot.getColWidth(0)).toBe(300);
    expect(hot.getColWidth(1)).toBe(300);
  });

  it('should prefer `columns[].width` that equals the grid `width` over `colWidths`', () => {
    createGrid({ width: 300, colWidths: 120, columns: [{ width: 300 }, {}] });

    expect(hot.getColWidth(0)).toBe(300);
    expect(hot.getColWidth(1)).toBe(120);
  });

  it('should apply a `cells` width that equals the grid `width`', () => {
    createGrid({ width: 300, cells: () => ({ width: 300 }) });

    expect(hot.getColWidth(0)).toBe(300);
  });

  it('should apply a width that equals the grid `width` and was set through `setCellMeta`', () => {
    createGrid({ width: 300, colWidths: 120 });

    hot.setCellMeta(0, 0, 'width', 300);

    expect(hot.getColWidth(0)).toBe(300);
    expect(hot.getColWidth(1)).toBe(120);
  });

  it('should not use the grid `width` as a column width when no column width is set', () => {
    createGrid({ width: 300, colWidths: 120 });

    expect(hot.getColWidth(0)).toBe(120);
    expect(hot.getColWidth(1)).toBe(120);
  });

  it('should apply a column width that differs from the grid `width`', () => {
    createGrid({ width: 300, columns: [{ width: 200 }, { width: 200 }] });

    expect(hot.getColWidth(0)).toBe(200);
  });
});
