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

  it('should follow the option when it changes', () => {
    const plugin = createGrid({ fixedColumnsEnd: 2 });

    hot.updateSettings({ fixedColumnsEnd: 0 });

    expect(plugin.moveColumns([0], 7)).toBe(true);
    expect(order()).toBe('BCDEFGHA');
  });
});
