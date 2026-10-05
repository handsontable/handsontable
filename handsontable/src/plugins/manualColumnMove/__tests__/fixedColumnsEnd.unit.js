import Handsontable from 'handsontable/base';
import { ManualColumnMove, HiddenColumns, registerPlugin } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(ManualColumnMove);
registerPlugin(HiddenColumns);

describe('ManualColumnMove – fixedColumnsEnd', () => {
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
   * Creates a grid of 8 columns, `A`...`H` in the first row.
   *
   * @param {object} settings The grid settings.
   * @returns {ManualColumnMove}
   */
  function createGrid(settings = {}) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']],
      manualColumnMove: true,
      ...settings,
    });

    return hot.getPlugin('manualColumnMove');
  }

  const order = () => hot.getDataAtRow(0).join('');

  it('should keep moving columns freely when there are no end columns', () => {
    const plugin = createGrid();

    expect(plugin.moveColumns([0], 7)).toBe(true);
    expect(order()).toBe('BCDEFGHA');
  });

  it('should not move a scrolling column into the end columns', () => {
    const plugin = createGrid({ fixedColumnsEnd: 2 });

    expect(plugin.isMovePossible([0], 7)).toBe(false);
    expect(plugin.isMovePossible([0], 6)).toBe(false);
    expect(plugin.moveColumns([0], 7)).toBe(false);
    expect(order()).toBe('ABCDEFGH');
  });

  it('should not move an end column out of the end columns', () => {
    const plugin = createGrid({ fixedColumnsEnd: 2 });

    expect(plugin.isMovePossible([7], 0)).toBe(false);
    expect(plugin.isMovePossible([6], 5)).toBe(false);
    expect(plugin.moveColumns([7], 0)).toBe(false);
    expect(order()).toBe('ABCDEFGH');
  });

  it('should not move a selection that holds scrolling and end columns', () => {
    const plugin = createGrid({ fixedColumnsEnd: 2 });

    expect(plugin.isMovePossible([5, 6], 0)).toBe(false);
    expect(plugin.isMovePossible([5, 6], 6)).toBe(false);
  });

  it('should move columns inside the scrolling part and inside the end columns', () => {
    const plugin = createGrid({ fixedColumnsEnd: 2 });

    expect(plugin.moveColumns([0], 5)).toBe(true);
    expect(order()).toBe('BCDEFAGH');
    expect(plugin.moveColumns([7], 6)).toBe(true);
    expect(order()).toBe('BCDEFAHG');
  });

  it('should check the drop index of a drag the same way', () => {
    const plugin = createGrid({ fixedColumnsEnd: 2 });

    // Dropping before the last column is the position right of "F", inside the end columns.
    expect(plugin.dragColumns([0], 7)).toBe(false);
    expect(plugin.dragColumns([0], 6)).toBe(true);
    expect(order()).toBe('BCDEFAGH');
  });

  it('should let the start columns keep the priority over end columns that would overlap them', () => {
    const plugin = createGrid({ fixedColumnsStart: 5, fixedColumnsEnd: 6 });

    // Only 3 columns are left for the end band: F, G, H.
    expect(plugin.isMovePossible([0], 4)).toBe(true);
    expect(plugin.isMovePossible([0], 5)).toBe(false);
    expect(plugin.isMovePossible([6], 5)).toBe(true);
  });

  describe('with hidden and trimmed columns', () => {
    /**
     * The columns the inline-end overlay renders, read from Walkontable: the band the plugin has to protect.
     *
     * @returns {string} The texts of the first row of the end overlay.
     */
    const renderedEndBand = () => {
      const cells = hot.view._wt.wtOverlays.inlineEndOverlay.clone.wtTable.TBODY.querySelector('tr').children;

      return Array.from(cells).map(cell => cell.textContent).join('');
    };

    it('should count a hidden column in the end columns as part of the band', () => {
      const plugin = createGrid({ fixedColumnsEnd: 2, hiddenColumns: { columns: [7] } });

      // The overlay holds "G" only (the hidden "H" is not drawn), the band is still the last two columns.
      expect(renderedEndBand()).toBe('G');
      expect(plugin.isFixedColumnsEnd(6)).toBe(true);
      expect(plugin.isFixedColumnsEnd(7)).toBe(true);
      expect(plugin.isFixedColumnsEnd(5)).toBe(false);
      expect(plugin.isMovePossible([0], 6)).toBe(false);
      expect(plugin.isMovePossible([0], 5)).toBe(true);
      expect(plugin.isMovePossible([6], 5)).toBe(false);
      expect(plugin.isMovePossible([6], 7)).toBe(true);
    });

    it('should not let a hidden column in the middle move the band', () => {
      const plugin = createGrid({ fixedColumnsEnd: 2, hiddenColumns: { columns: [3] } });

      expect(renderedEndBand()).toBe('GH');
      expect(plugin.getFixedColumnsEndCount()).toBe(2);
      expect(plugin.isMovePossible([0], 5)).toBe(true);
      expect(plugin.isMovePossible([0], 6)).toBe(false);
    });

    it('should leave the band where it is when a column is trimmed before it', () => {
      const plugin = createGrid({ fixedColumnsEnd: 2 });
      const trimmingMap = hot.columnIndexMapper.createAndRegisterIndexMap('test', 'trimming');

      trimmingMap.setValueAtIndex(1, true);
      hot.render();

      // Seven columns are left: A, C, D, E, F, G, H. The band is the last two of them.
      expect(hot.columnIndexMapper.getNotTrimmedIndexesLength()).toBe(7);
      expect(renderedEndBand()).toBe('GH');
      expect(plugin.getFixedColumnsEndCount()).toBe(2);
      expect(plugin.isFixedColumnsEnd(4)).toBe(false);
      expect(plugin.isFixedColumnsEnd(5)).toBe(true);
      expect(plugin.isMovePossible([0], 5)).toBe(false);
      expect(plugin.isMovePossible([0], 4)).toBe(true);
    });

    it('should take the band from the trimmed columns when the last column is trimmed', () => {
      const plugin = createGrid({ fixedColumnsEnd: 2 });
      const trimmingMap = hot.columnIndexMapper.createAndRegisterIndexMap('test', 'trimming');

      trimmingMap.setValueAtIndex(7, true);
      hot.render();

      // Seven columns are left: A to G. The band is F, G.
      expect(renderedEndBand()).toBe('FG');
      expect(plugin.isMovePossible([0], 4)).toBe(true);
      expect(plugin.isMovePossible([0], 5)).toBe(false);
      expect(plugin.isMovePossible([5], 6)).toBe(true);
    });

    it('should agree with the overlay when the start columns leave less room than the end columns ask for', () => {
      const plugin = createGrid({ fixedColumnsStart: 5, fixedColumnsEnd: 6, hiddenColumns: { columns: [7] } });

      // The start band keeps A to E. The end band can only hold F and G (H is hidden).
      expect(renderedEndBand()).toBe('FG');
      expect(plugin.getFixedColumnsEndCount()).toBe(3);
      expect(plugin.isFixedColumnsEnd(5)).toBe(true);
      expect(plugin.isFixedColumnsEnd(4)).toBe(false);
      expect(plugin.isMovePossible([0], 4)).toBe(true);
      expect(plugin.isMovePossible([0], 5)).toBe(false);
    });

    it('should leave no end band when the start columns cover every column', () => {
      const plugin = createGrid({ fixedColumnsStart: 8, fixedColumnsEnd: 3 });

      expect(plugin.getFixedColumnsEndCount()).toBe(0);
      expect(plugin.isMovePossible([0], 7)).toBe(true);
    });

    it('should keep the end band within the columns left after the start columns, close to the total', () => {
      const plugin = createGrid({ fixedColumnsStart: 7, fixedColumnsEnd: 3 });

      // Only the last column is left for the end band.
      expect(renderedEndBand()).toBe('H');
      expect(plugin.getFixedColumnsEndCount()).toBe(1);
      expect(plugin.isMovePossible([0], 7)).toBe(false);
      expect(plugin.isMovePossible([0], 6)).toBe(true);
    });
  });

  it('should protect the columns the grid draws when maxCols caps the column count', () => {
    const plugin = createGrid({
      data: [Array.from({ length: 15 }, (_, index) => String.fromCharCode(65 + index))],
      maxCols: 10,
      fixedColumnsEnd: 2,
    });

    // 15 data columns, 10 drawn: the band is columns 8 and 9, not the uncapped 13 and 14.
    expect(hot.countCols()).toBe(10);
    expect(plugin.getFixedColumnsEndCount()).toBe(2);
    expect(plugin.isFixedColumnsEnd(8)).toBe(true);
    expect(plugin.isFixedColumnsEnd(7)).toBe(false);
    expect(plugin.isMovePossible([8], 3)).toBe(false);
    expect(plugin.isMovePossible([3], 8)).toBe(false);
    expect(plugin.isMovePossible([3], 7)).toBe(true);
    expect(plugin.moveColumns([8], 3)).toBe(false);
  });

  it('should not treat the columns that maxCols hides past the drawn ones as end columns', () => {
    const plugin = createGrid({
      data: [Array.from({ length: 15 }, (_, index) => String.fromCharCode(65 + index))],
      maxCols: 10,
      fixedColumnsEnd: 2,
    });

    // Indexes 10...14 are mapper columns the grid does not draw, they lie past the band.
    expect(plugin.isFixedColumnsEnd(9)).toBe(true);
    expect(plugin.isFixedColumnsEnd(10)).toBe(false);
    expect(plugin.isFixedColumnsEnd(14)).toBe(false);
    // A hidden column moved among the hidden ones leaves the drawn band alone.
    expect(plugin.isMovePossible([10], 12)).toBe(true);
    // Brought into the drawn columns it would push a scrolling column into the band.
    expect(plugin.isMovePossible([10], 3)).toBe(false);
  });

  it('should build a grid with an initial column order and end columns', () => {
    // The initial `manualColumnMove` array moves the columns while the plugin is enabled, before the table view
    // exists. Reading the end band from the view there threw during the init.
    expect(() => {
      createGrid({ manualColumnMove: [1, 0, 2, 3, 4, 5, 6, 7], fixedColumnsEnd: 2 });
    }).not.toThrow();

    const orderWithEndColumns = order();

    hot.destroy();
    hot = null;

    // The same initial array without end columns is the control: the end columns must not change the result.
    createGrid({ manualColumnMove: [1, 0, 2, 3, 4, 5, 6, 7] });
    expect(orderWithEndColumns).toBe(order());
    expect(hot.getPlugin('manualColumnMove').getFixedColumnsEndCount()).toBe(0);
  });

  it('should allow a full column order that keeps the end columns last', () => {
    const plugin = createGrid({ fixedColumnsEnd: 2 });

    expect(plugin.isMovePossible([1, 0, 2, 3, 4, 5, 6, 7], 0)).toBe(true);
    expect(plugin.isMovePossible([1, 0, 2, 3, 4, 5, 7, 6], 0)).toBe(true);
    // A full order that takes a scrolling column into the band is refused.
    expect(plugin.isMovePossible([0, 1, 2, 3, 4, 6, 7, 5], 0)).toBe(false);
  });

  it('should follow the option when it changes', () => {
    const plugin = createGrid({ fixedColumnsEnd: 2 });

    hot.updateSettings({ fixedColumnsEnd: 0 });

    expect(plugin.moveColumns([0], 7)).toBe(true);
    expect(order()).toBe('BCDEFGHA');
  });
});
