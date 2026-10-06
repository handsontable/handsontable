import Handsontable from 'handsontable/base';
import { ManualColumnFreeze, registerPlugin } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(ManualColumnFreeze);

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
    plugin.unfreezeColumn(0);

    expect(order()).toBe('FABCDEGHIJ');
  });

  it('should keep the column at the freeze line with `restoreColumnPosition: false`', () => {
    const plugin = createGrid({ manualColumnFreeze: { restoreColumnPosition: false } });

    plugin.freezeColumn(5);
    plugin.unfreezeColumn(0);

    expect(order()).toBe('FABCDEGHIJ');
  });

  it('should put the unfrozen column back before the next column in data order', () => {
    const plugin = createGrid();

    plugin.freezeColumn(5);

    expect(order()).toBe('FABCDEGHIJ');

    plugin.unfreezeColumn(0);

    expect(order()).toBe('ABCDEFGHIJ');
    expect(hot.getSettings().fixedColumnsStart).toBe(0);
  });

  it('should make the column the last one when no column comes after it in data order', () => {
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

  it('should place the column by the scrollable columns\' order when they were reordered', () => {
    const plugin = createGrid();

    plugin.freezeColumn(5);
    // Move `H` to the start of the scrollable columns while `F` is frozen.
    hot.columnIndexMapper.moveIndexes(7, 1);

    expect(order()).toBe('FHABCDEGIJ');

    plugin.unfreezeColumn(0);

    // `H` is the first scrollable column after `F` in data order, so `F` lands before it.
    expect(order()).toBe('FHABCDEGIJ');
    expect(hot.getSettings().fixedColumnsStart).toBe(0);
  });

  it('should keep the restored column out of the `fixedColumnsEnd` band', () => {
    const plugin = createGrid({ fixedColumnsEnd: 2 });

    plugin.freezeColumn(7);

    expect(order()).toBe('HABCDEFGIJ');

    plugin.unfreezeColumn(0);

    expect(order()).toBe('ABCDEFGHIJ');
  });

  it('should stop before the `fixedColumnsEnd` band when no scrollable column comes after it in data order', () => {
    const plugin = createGrid({ fixedColumnsEnd: 2 });

    // Put `A` and `B` into the end band, so the band holds columns from the start of the data order.
    hot.columnIndexMapper.moveIndexes([0, 1], 8);

    expect(order()).toBe('CDEFGHIJAB');

    plugin.freezeColumn(7);

    expect(order()).toBe('JCDEFGHIAB');

    plugin.unfreezeColumn(0);

    // No scrollable column comes after `J` in data order. It becomes the last scrollable column, and the band
    // keeps `A` and `B`.
    expect(order()).toBe('CDEFGHIJAB');
  });

});
