import Handsontable from 'handsontable/base';
import { ManualColumnFreeze, registerPlugin } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';
import freezeColumnItem from '../contextMenuItem/freezeColumn';
import unfreezeColumnItem from '../contextMenuItem/unfreezeColumn';

registerAllCellTypes();
registerPlugin(ManualColumnFreeze);

describe('ManualColumnFreeze – fixedColumnsEnd', () => {
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
   * Creates a grid of 10 columns, `A`...`J` in the first row.
   *
   * @param {object} settings The grid settings.
   * @returns {ManualColumnFreeze}
   */
  function createGrid(settings = {}) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']],
      manualColumnFreeze: true,
      ...settings,
    });

    return hot.getPlugin('manualColumnFreeze');
  }

  const order = () => hot.getDataAtRow(0).join('');

  describe('freezeColumn()', () => {
    it('should freeze any column when there are no end columns', () => {
      const plugin = createGrid();

      plugin.freezeColumn(9);

      expect(order()).toBe('JABCDEFGHI');
      expect(hot.getSettings().fixedColumnsStart).toBe(1);
    });

    it('should refuse to freeze a column of the end band', () => {
      const plugin = createGrid({ fixedColumnsEnd: 2 });
      const afterColumnFreeze = jest.fn();

      hot.addHook('afterColumnFreeze', afterColumnFreeze);
      plugin.freezeColumn(9);
      plugin.freezeColumn(8);

      expect(order()).toBe('ABCDEFGHIJ');
      expect(hot.getSettings().fixedColumnsStart).toBe(0);
      // The hooks follow the "not performed" path of the other columns that cannot be frozen.
      expect(afterColumnFreeze).toHaveBeenNthCalledWith(1, 9, false);
      expect(afterColumnFreeze).toHaveBeenNthCalledWith(2, 8, false);
    });

    it('should still freeze a scrolling column and leave the end band as it was', () => {
      const plugin = createGrid({ fixedColumnsEnd: 2 });

      plugin.freezeColumn(7);

      expect(order()).toBe('HABCDEFGIJ');
      expect(hot.getSettings().fixedColumnsStart).toBe(1);
      expect(hot.getDataAtRow(0).slice(-2).join('')).toBe('IJ');
    });
  });

  describe('unfreezeColumn()', () => {
    it('should unfreeze when there are no end columns', () => {
      const plugin = createGrid({ fixedColumnsStart: 9 });

      plugin.unfreezeColumn(0);

      expect(order()).toBe('BCDEFGHIAJ');
      expect(hot.getSettings().fixedColumnsStart).toBe(8);
    });

    it('should unfreeze a column when the end band is not cut down by the start band', () => {
      const plugin = createGrid({ fixedColumnsStart: 2, fixedColumnsEnd: 2 });

      plugin.unfreezeColumn(0);

      expect(order()).toBe('BACDEFGHIJ');
      expect(hot.getSettings().fixedColumnsStart).toBe(1);
    });

    it('should refuse to unfreeze a column into the end band that the start band cuts down', () => {
      // 9 start columns leave one for the end band, so unfreezing would hand a column back to it.
      const plugin = createGrid({ fixedColumnsStart: 9, fixedColumnsEnd: 2 });
      const afterColumnUnfreeze = jest.fn();

      hot.addHook('afterColumnUnfreeze', afterColumnUnfreeze);
      plugin.unfreezeColumn(0);

      expect(order()).toBe('ABCDEFGHIJ');
      expect(hot.getSettings().fixedColumnsStart).toBe(9);
      expect(afterColumnUnfreeze).toHaveBeenCalledWith(0, false, 0);
    });
  });

  describe('context menu items', () => {
    const hiddenFor = (item, column) => {
      hot.selectColumns(column);

      return item.hidden.call(hot);
    };

    it('should hide "Freeze column" for the columns of the end band only', () => {
      const plugin = createGrid({ fixedColumnsEnd: 2 });
      const item = freezeColumnItem(plugin);

      expect(hiddenFor(item, 7)).toBe(false);
      expect(hiddenFor(item, 8)).toBe(true);
      expect(hiddenFor(item, 9)).toBe(true);
    });

    it('should keep "Freeze column" for every scrolling column without end columns', () => {
      const plugin = createGrid();
      const item = freezeColumnItem(plugin);

      expect(hiddenFor(item, 9)).toBe(false);
    });

    it('should hide "Unfreeze column" when it would move a column into the end band', () => {
      const plugin = createGrid({ fixedColumnsStart: 9, fixedColumnsEnd: 2 });
      const item = unfreezeColumnItem(plugin);

      expect(hiddenFor(item, 0)).toBe(true);
    });

    it('should show "Unfreeze column" for a frozen column when the end band is not cut down', () => {
      const plugin = createGrid({ fixedColumnsStart: 2, fixedColumnsEnd: 2 });
      const item = unfreezeColumnItem(plugin);

      expect(hiddenFor(item, 0)).toBe(false);
    });
  });
});
