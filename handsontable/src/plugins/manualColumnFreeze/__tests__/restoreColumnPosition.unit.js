import Handsontable from 'handsontable/base';
import { HiddenColumns, ManualColumnFreeze, UndoRedo, registerPlugin } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(ManualColumnFreeze);
registerPlugin(HiddenColumns);
registerPlugin(UndoRedo);

describe('ManualColumnFreeze – restoreColumnPosition', () => {
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
      manualColumnFreeze: { restoreColumnPosition: true },
      ...settings,
    });

    return hot.getPlugin('manualColumnFreeze');
  }

  const order = () => hot.getDataAtRow(0).join('');

  it('should keep the column at the freeze line with `manualColumnFreeze: true`', () => {
    const plugin = createGrid({ manualColumnFreeze: true });

    plugin.freezeColumn(5);
    plugin.freezeColumn(6);
    plugin.unfreezeColumn(0);

    // `F` moves to the first position after the remaining frozen column.
    expect(order()).toBe('GFABCDEHIJ');
    expect(hot.getSettings().fixedColumnsStart).toBe(1);
  });

  it('should keep the column at the freeze line with `restoreColumnPosition: false`', () => {
    const plugin = createGrid({ manualColumnFreeze: { restoreColumnPosition: false } });

    plugin.freezeColumn(5);
    plugin.freezeColumn(6);
    plugin.unfreezeColumn(0);

    expect(order()).toBe('GFABCDEHIJ');
    expect(hot.getSettings().fixedColumnsStart).toBe(1);
  });

  it('should keep the column at the freeze line with an empty settings object', () => {
    const plugin = createGrid({ manualColumnFreeze: {} });

    plugin.freezeColumn(5);
    plugin.freezeColumn(6);
    plugin.unfreezeColumn(0);

    expect(order()).toBe('GFABCDEHIJ');
  });

  it('should ignore an invalid `restoreColumnPosition` value', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const plugin = createGrid({ manualColumnFreeze: { restoreColumnPosition: 'yes' } });

    plugin.freezeColumn(5);
    plugin.freezeColumn(6);
    plugin.unfreezeColumn(0);

    expect(order()).toBe('GFABCDEHIJ');
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('should follow `restoreColumnPosition` switched on and off with `updateSettings()`', () => {
    const plugin = createGrid({ manualColumnFreeze: true });

    hot.updateSettings({ manualColumnFreeze: { restoreColumnPosition: true } });

    plugin.freezeColumn(5);
    plugin.unfreezeColumn(0);

    expect(order()).toBe('ABCDEFGHIJ');

    hot.updateSettings({ manualColumnFreeze: true });

    plugin.freezeColumn(5);
    plugin.freezeColumn(6);
    plugin.unfreezeColumn(0);

    expect(order()).toBe('GFABCDEHIJ');
  });

  it('should put the unfrozen column back at its place in data order', () => {
    const plugin = createGrid();

    plugin.freezeColumn(5);

    expect(order()).toBe('FABCDEGHIJ');

    plugin.unfreezeColumn(0);

    expect(order()).toBe('ABCDEFGHIJ');
    expect(hot.getSettings().fixedColumnsStart).toBe(0);
  });

  it('should pass the restored index to the unfreeze hooks', () => {
    const beforeColumnUnfreeze = jest.fn();
    const afterColumnUnfreeze = jest.fn();
    const plugin = createGrid({ beforeColumnUnfreeze, afterColumnUnfreeze });

    plugin.freezeColumn(5);
    plugin.unfreezeColumn(0);

    expect(beforeColumnUnfreeze).toHaveBeenCalledWith(0, true, 5);
    expect(afterColumnUnfreeze).toHaveBeenCalledWith(0, true, 5);
  });

  it('should make the column the last one when it is the last in data order', () => {
    const plugin = createGrid();

    plugin.freezeColumn(9);
    plugin.unfreezeColumn(0);

    expect(order()).toBe('ABCDEFGHIJ');
  });

  it('should never pick a column that stays frozen as the neighbor', () => {
    // `A` and `B` are frozen through the option, not through the plugin. Unfreezing `A` must not
    // land it before `B`, which is still frozen, or `A` would stay inside the frozen area.
    const plugin = createGrid({ fixedColumnsStart: 2 });

    plugin.unfreezeColumn(0);

    expect(order()).toBe('BACDEFGHIJ');
    expect(hot.getSettings().fixedColumnsStart).toBe(1);
  });

  it('should restore a column frozen behind another frozen column', () => {
    const plugin = createGrid();

    plugin.freezeColumn(5);
    plugin.freezeColumn(4);

    expect(order()).toBe('FDABCEGHIJ');

    plugin.unfreezeColumn(0);

    expect(order()).toBe('DABCEFGHIJ');

    plugin.unfreezeColumn(0);

    expect(order()).toBe('ABCDEFGHIJ');
  });

  it('should place the column right after the last column before it in data order when columns were reordered', () => {
    const plugin = createGrid();

    plugin.freezeColumn(5);
    // Move `H` to the start of the scrollable columns while `F` is frozen.
    hot.columnIndexMapper.moveIndexes(7, 1);

    expect(order()).toBe('FHABCDEGIJ');

    plugin.unfreezeColumn(0);

    // `E` is the last scrollable column that comes before `F` in data order, so `F` lands right after it.
    expect(order()).toBe('HABCDEFGIJ');
    expect(hot.getSettings().fixedColumnsStart).toBe(0);
  });

  it('should count hidden columns as neighbors', () => {
    const plugin = createGrid({ hiddenColumns: { columns: [4] } });

    plugin.freezeColumn(5);
    plugin.unfreezeColumn(0);

    // `E` is hidden, but it still holds its place in the column order, so `F` lands right after it.
    expect(order()).toBe('ABCDEFGHIJ');
    expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([4]);
  });

  it('should undo and redo a restore as one step', () => {
    const plugin = createGrid({ undo: true });

    plugin.freezeColumn(5);
    plugin.unfreezeColumn(0);

    expect(order()).toBe('ABCDEFGHIJ');

    hot.getPlugin('undoRedo').undo();

    expect(order()).toBe('FABCDEGHIJ');
    expect(hot.getSettings().fixedColumnsStart).toBe(1);

    hot.getPlugin('undoRedo').redo();

    expect(order()).toBe('ABCDEFGHIJ');
    expect(hot.getSettings().fixedColumnsStart).toBe(0);
  });

  it('should restore a column right before the `fixedColumnsEnd` band', () => {
    const plugin = createGrid({ fixedColumnsEnd: 2 });

    plugin.freezeColumn(7);

    expect(order()).toBe('HABCDEFGIJ');

    plugin.unfreezeColumn(0);

    expect(order()).toBe('ABCDEFGHIJ');
  });

  it('should never land the column in the `fixedColumnsEnd` band, even when the band holds columns before it in data order', () => {
    const plugin = createGrid({ fixedColumnsEnd: 2 });

    // Put `A` and `B` into the end band, so the band holds columns from the start of the data order.
    hot.columnIndexMapper.moveIndexes([0, 1], 8);

    expect(order()).toBe('CDEFGHIJAB');

    plugin.freezeColumn(7);

    expect(order()).toBe('JCDEFGHIAB');

    plugin.unfreezeColumn(0);

    // `A` and `B` come before `J` in data order, but they belong to the band: `J` lands after `I`, the last
    // scrollable column before it, and the band keeps `A` and `B`.
    expect(order()).toBe('CDEFGHIJAB');
  });

});
