import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

/**
 * Lets the deferred work of a sheet switch settle.
 *
 * @returns {Promise<void>}
 */
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Reads the selection as `[fromRow, fromCol, toRow, toCol]` tuples, or `null` when nothing is selected.
 *
 * @param {Core} hot The grid.
 * @returns {Array|null}
 */
function readSelection(hot) {
  return hot.getSelectedRange()?.map(({ from, to }) => [from.row, from.col, to.row, to.col]) ?? null;
}

describe('EmptyDataState lifecycle', () => {
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

  describe('a data replacement while the overlay is shown', () => {
    it('selects nothing on the new data when a selection was made on the replaced data', () => {
      hot = new Handsontable(container, {
        data: [['a1', 'a2'], ['a3', 'a4'], ['a5', 'a6']],
        emptyDataState: true,
        licenseKey: LICENSE_KEY,
      });

      hot.selectCell(2, 1);
      hot.loadData([]);

      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);

      hot.loadData([['b1', 'b2'], ['b3', 'b4'], ['b5', 'b6']]);

      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(false);
      expect(readSelection(hot)).toBeNull();
    });

    it('still selects the first cell when data arrives on a grid that had no selection', () => {
      hot = new Handsontable(container, {
        data: [],
        emptyDataState: true,
        licenseKey: LICENSE_KEY,
      });

      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);
      expect(readSelection(hot)).toBeNull();

      hot.loadData([['b1', 'b2'], ['b3', 'b4'], ['b5', 'b6']]);

      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(false);
      expect(readSelection(hot)).toEqual([[0, 0, 0, 0]]);
    });

    it('puts the selection back after `updateData()`, which keeps the dataset state', () => {
      hot = new Handsontable(container, {
        data: [['a1', 'a2'], ['a3', 'a4'], ['a5', 'a6']],
        emptyDataState: true,
        licenseKey: LICENSE_KEY,
      });

      hot.selectCell(2, 1);
      hot.updateData([]);

      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);

      hot.updateData([['b1', 'b2'], ['b3', 'b4'], ['b5', 'b6']]);

      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(false);
      expect(readSelection(hot)).toEqual([[2, 1, 2, 1]]);
    });

    it('puts the selection back after a load while the grid has an external data source', () => {
      hot = new Handsontable(container, {
        data: [['a1', 'a2'], ['a3', 'a4'], ['a5', 'a6']],
        emptyDataState: true,
        licenseKey: LICENSE_KEY,
      });

      hot.selectCell(2, 1);
      hot.loadData([]);

      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);

      hot.addHook('hasExternalDataSource', () => true);
      hot.loadData([['b1', 'b2'], ['b3', 'b4'], ['b5', 'b6']]);

      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(false);
      expect(readSelection(hot)).toEqual([[2, 1, 2, 1]]);
    });

    it('still puts the selection back when rows come back without a data replacement', () => {
      hot = new Handsontable(container, {
        data: [['a1', 'a2'], ['a3', 'a4'], ['a5', 'a6']],
        emptyDataState: true,
        licenseKey: LICENSE_KEY,
      });

      hot.selectCell(2, 1);
      hot.updateSettings({ hiddenRows: { rows: [0, 1, 2] } });

      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);

      hot.updateSettings({ hiddenRows: { rows: [] } });

      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(false);
      expect(readSelection(hot)).toEqual([[2, 1, 2, 1]]);
    });

    it('opens a sheet the user never visited with nothing selected, not with the selection of the sheet they emptied', async() => {
      hot = new Handsontable(container, {
        emptyDataState: true,
        sheetsBar: {
          sheets: [
            { name: 'A', data: [['a1', 'a2'], ['a3', 'a4'], ['a5', 'a6']] },
            { name: 'B', data: [['b1', 'b2'], ['b3', 'b4'], ['b5', 'b6']] },
          ],
        },
        licenseKey: LICENSE_KEY,
      });

      hot.selectCell(2, 1);
      hot.loadData([]);

      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);

      hot.getPlugin('sheetsBar').setActiveSheet('B');
      await flush();

      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(false);
      expect(readSelection(hot)).toBeNull();
    });
  });

  describe('turning the plugin off while the overlay is shown', () => {
    it('reports the overlay as hidden once the plugin is off', () => {
      hot = new Handsontable(container, {
        data: [],
        emptyDataState: true,
        licenseKey: LICENSE_KEY,
      });
      const plugin = hot.getPlugin('emptyDataState');

      expect(plugin.isVisible()).toBe(true);

      hot.updateSettings({ emptyDataState: false });

      expect(plugin.enabled).toBe(false);
      expect(plugin.isVisible()).toBe(false);
    });

    it('does not fire a hide nor select a cell when the plugin is turned on again over data', () => {
      const hidden = jest.fn();

      hot = new Handsontable(container, {
        data: [],
        emptyDataState: true,
        afterEmptyDataStateHide: hidden,
        licenseKey: LICENSE_KEY,
      });

      hot.updateSettings({ emptyDataState: false });
      hot.updateSettings({ data: [['x', 'y'], ['z', 'w']] });
      hot.deselectCell();
      hot.updateSettings({ emptyDataState: true });

      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(false);
      expect(hidden).not.toHaveBeenCalled();
      expect(readSelection(hot)).toBeNull();
    });

    it('keeps a shown overlay shown across an update of its own options', () => {
      const hidden = jest.fn();
      const shown = jest.fn();

      hot = new Handsontable(container, {
        data: [],
        emptyDataState: true,
        licenseKey: LICENSE_KEY,
      });
      hot.addHook('afterEmptyDataStateHide', hidden);
      hot.addHook('afterEmptyDataStateShow', shown);

      hot.updateSettings({ emptyDataState: { message: 'Nothing here' } });

      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);
      expect(hidden).not.toHaveBeenCalled();
      expect(shown).not.toHaveBeenCalled();
    });

    it('does not fire a hide on a sheet with the plugin on after a sheet with the plugin off', async() => {
      const hidden = jest.fn();

      hot = new Handsontable(container, {
        sheetsBar: {
          sheets: [
            { name: 'A', data: [], settings: { emptyDataState: true } },
            { name: 'B', data: [['b1']], settings: { emptyDataState: false } },
            { name: 'C', data: [['c1']], settings: { emptyDataState: true } },
          ],
        },
        licenseKey: LICENSE_KEY,
      });
      const plugin = hot.getPlugin('emptyDataState');
      const sheetsBar = hot.getPlugin('sheetsBar');

      expect(plugin.isVisible()).toBe(true);

      sheetsBar.setActiveSheet('B');
      await flush();

      expect(plugin.isVisible()).toBe(false);

      hot.addHook('afterEmptyDataStateHide', hidden);
      sheetsBar.setActiveSheet('C');
      await flush();

      expect(plugin.isVisible()).toBe(false);
      expect(hidden).not.toHaveBeenCalled();
      expect(readSelection(hot)).toBeNull();
    });
  });
});
