import Handsontable from 'handsontable/base';
import { CollapsibleColumns, NestedHeaders, registerPlugin } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(NestedHeaders);
registerPlugin(CollapsibleColumns);

/**
 * A column order written straight into the column index mapper re-derives the header tree. A collapsed
 * group the new order splits loses its collapse there, so the columns the collapse hid have to come back
 * with it, or nothing on the header can show them again.
 */
describe('CollapsibleColumns – a column order written without a move', () => {
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
   * Creates a grid of five columns under a collapsible group of three and a group of two, with the first
   * group collapsed.
   *
   * @returns {object} The Handsontable instance.
   */
  function createCollapsedGrid() {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [['a1', 'b1', 'c1', 'd1', 'e1']],
      collapsibleColumns: true,
      nestedHeaders: [
        [{ label: 'G1', colspan: 3, collapsible: true }, { label: 'G2', colspan: 2 }],
        ['A', 'B', 'C', 'D', 'E'],
      ],
    });

    hot.getPlugin('collapsibleColumns').collapseSection({ row: -2, col: 0 });

    return hot;
  }

  /**
   * Returns the physical columns hidden by any source.
   *
   * @returns {number[]}
   */
  function hiddenPhysicalColumns() {
    return [0, 1, 2, 3, 4].filter(physicalColumn => hot.columnIndexMapper.isHidden(physicalColumn));
  }

  it('shows the columns of a collapsed group the new order moves part of out', () => {
    createCollapsedGrid();

    expect(hiddenPhysicalColumns()).toEqual([1, 2]);

    hot.columnIndexMapper.setIndexesSequence([0, 1, 3, 4, 2]);
    hot.render();

    expect(hot.getPlugin('nestedHeaders').getStateManager().getCollapsedGroups()).toEqual([]);
    expect(hot.getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([]);
    expect(hiddenPhysicalColumns()).toEqual([]);
  });

  it('shows the columns of a collapsed group the new order puts another column inside', () => {
    createCollapsedGrid();

    hot.columnIndexMapper.setIndexesSequence([0, 3, 1, 2, 4]);
    hot.render();

    expect(hot.getPlugin('nestedHeaders').getStateManager().getCollapsedGroups()).toEqual([]);
    expect(hot.getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([]);
    expect(hiddenPhysicalColumns()).toEqual([]);
  });

  it('shows the columns of a collapsed group a batched order write splits when the batch ends', () => {
    createCollapsedGrid();

    hot.batch(() => {
      hot.columnIndexMapper.setIndexesSequence([0, 1, 3, 4, 2]);
    });

    expect(hot.getPlugin('nestedHeaders').getStateManager().getCollapsedGroups()).toEqual([]);
    expect(hiddenPhysicalColumns()).toEqual([]);
  });

  it('keeps a collapsed group collapsed when the new order keeps its columns together', () => {
    createCollapsedGrid();

    hot.columnIndexMapper.setIndexesSequence([3, 4, 0, 1, 2]);
    hot.render();

    expect(hot.getPlugin('nestedHeaders').getStateManager().getCollapsedGroups())
      .toEqual([expect.objectContaining({ headerLevel: 0, columnIndex: 2 })]);
    expect(hot.getPlugin('collapsibleColumns').getCollapsedColumns()).toEqual([1, 2]);
    expect(hiddenPhysicalColumns()).toEqual([1, 2]);
  });
});
