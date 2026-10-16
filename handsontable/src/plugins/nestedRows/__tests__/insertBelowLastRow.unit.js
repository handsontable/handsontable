import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { NestedRows } from '../nestedRows';
import { TrimRows } from '../../trimRows/trimRows';
import { HiddenRows } from '../../hiddenRows/hiddenRows';

/**
 * DEV-139: a row inserted below the last row of the tree joins the parent of the row it continues,
 * instead of becoming a new top-level parent. The tree shape is read from the raw nested source,
 * because `getSourceData()` is flattened by the plugin.
 */
describe('NestedRows – inserting below the last row', () => {
  let container;
  let hot;

  const createData = () => [
    { item: 'P1', __children: [{ item: 'x' }] },
    { item: 'P2', __children: [{ item: 'a', __children: [{ item: 'deep' }] }, { item: 'b' }] },
  ];

  const createGrid = (settings = {}) => {
    hot = new Handsontable(container, {
      data: createData(),
      columns: [{ data: 'item' }],
      nestedRows: true,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  };

  const rawData = () => hot.getPlugin('nestedRows').dataManager.getRawSourceData();
  const topLevelItems = () => rawData().map(row => row.item);
  const childItems = parentIndex => rawData()[parentIndex].__children.map(row => row.item);

  beforeAll(() => {
    registerPlugin(NestedRows);
    registerPlugin(TrimRows);
    registerPlugin(HiddenRows);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('adds the fill handle\'s rows to the parent of the last row', () => {
    createGrid();

    hot.alter('insert_row_below', undefined, 1, 'Autofill.fill');
    hot.alter('insert_row_below', undefined, 1, 'Autofill.fill');

    expect(topLevelItems()).toEqual(['P1', 'P2']);
    expect(childItems(1)).toEqual(['a', 'b', null, null]);
    expect(hot.countRows()).toBe(8);
    expect(hot.getPlugin('nestedRows').dataManager.getRowLevel(7)).toBe(1);
  });

  it('adds the fill handle\'s row next to a deeply nested last row', () => {
    createGrid({ data: [{ item: 'P', __children: [{ item: 'C', __children: [{ item: 'G' }] }] }] });

    hot.alter('insert_row_below', undefined, 1, 'Autofill.fill');

    expect(rawData()).toEqual([
      { item: 'P', __children: [{ item: 'C', __children: [{ item: 'G' }, { item: null }] }] },
    ]);
  });

  it('adds a row inserted below the last row by its index to that row\'s parent', () => {
    createGrid();

    hot.alter('insert_row_below', 5, 2);

    expect(topLevelItems()).toEqual(['P1', 'P2']);
    expect(childItems(1)).toEqual(['a', 'b', null, null]);
  });

  it('keeps appending a top-level row for an insert that names no row', () => {
    createGrid();

    hot.alter('insert_row_below');

    expect(topLevelItems()).toEqual(['P1', 'P2', null]);
    expect(childItems(1)).toEqual(['a', 'b']);
  });

  it('keeps adding the `minSpareRows` rows at the top level', () => {
    createGrid({ minSpareRows: 1 });

    expect(topLevelItems()).toEqual(['P1', 'P2', null]);
    expect(childItems(1)).toEqual(['a', 'b']);
  });

  it('keeps adding a top-level row for an edit past the last row', () => {
    createGrid();

    hot.setDataAtCell(6, 0, 'typed');

    expect(topLevelItems()).toEqual(['P1', 'P2', 'typed']);
    expect(childItems(1)).toEqual(['a', 'b']);
  });

  it('continues the level of a collapsed last parent, not of its hidden children', () => {
    createGrid();
    hot.getPlugin('nestedRows').collapseParent(2);

    hot.alter('insert_row_below', undefined, 1, 'Autofill.fill');

    expect(topLevelItems()).toEqual(['P1', 'P2', null]);
    expect(childItems(1)).toEqual(['a', 'b']);
  });

  it('adds the fill handle\'s row next to a collapsed nested last parent', () => {
    createGrid({ data: [{ item: 'P', __children: [{ item: 'C', __children: [{ item: 'G' }] }] }] });
    hot.getPlugin('nestedRows').collapseParent(1);

    hot.alter('insert_row_below', undefined, 1, 'Autofill.fill');

    expect(rawData()).toEqual([
      { item: 'P', __children: [{ item: 'C', __children: [{ item: 'G' }] }, { item: null }] },
    ]);
  });

  it('appends a top-level row when the last visible row does not end the tree', () => {
    // TrimRows hides the whole of P2, so a sibling of the last visible row ("x") would land in the
    // middle of the flattened tree, away from the index the Core inserted at.
    createGrid({ trimRows: [2, 3, 4, 5] });

    hot.alter('insert_row_below', undefined, 1, 'Autofill.fill');

    expect(topLevelItems()).toEqual(['P1', 'P2', null]);
    expect(childItems(0)).toEqual(['x']);
  });

  it('continues the level of the last rendered row when the last row is hidden', () => {
    // HiddenRows keeps "c3" in `countRows()`, but the last row the user sees is the top-level P2.
    createGrid({
      data: [
        { item: 'P1', __children: [{ item: 'c1' }, { item: 'c2' }] },
        { item: 'P2', __children: [{ item: 'c3' }] },
      ],
      hiddenRows: { rows: [4] },
    });

    hot.alter('insert_row_below', undefined, 1, 'Autofill.fill');

    expect(topLevelItems()).toEqual(['P1', 'P2', null]);
    expect(childItems(1)).toEqual(['c3']);
  });

  it('appends a top-level row when a hidden last row belongs to another branch than the last rendered one', () => {
    // "b" is hidden, so the last rendered row is "deep", whose subtree does not end the tree.
    createGrid({ hiddenRows: { rows: [5] } });

    hot.alter('insert_row_below', undefined, 1, 'Autofill.fill');

    expect(topLevelItems()).toEqual(['P1', 'P2', null]);
    expect(childItems(1)).toEqual(['a', 'b']);
  });

  it('ignores a hidden row above the last row', () => {
    createGrid({ hiddenRows: { rows: [1] } });

    hot.alter('insert_row_below', undefined, 1, 'Autofill.fill');

    expect(topLevelItems()).toEqual(['P1', 'P2']);
    expect(childItems(1)).toEqual(['a', 'b', null]);
  });

  // The anchor is replaced on every `beforeCreateRow`, and every Core insert runs that hook before it
  // splices. This fails when the listener keeps an earlier anchor for an insert that names no row.
  it('does not reuse the row of a vetoed insert for the next one', () => {
    createGrid();

    const veto = () => false;

    hot.addHook('beforeCreateRow', veto);
    hot.alter('insert_row_below', undefined, 1, 'Autofill.fill');
    hot.removeHook('beforeCreateRow', veto);

    expect(hot.countRows()).toBe(6);

    hot.alter('insert_row_below');

    expect(topLevelItems()).toEqual(['P1', 'P2', null]);
    expect(childItems(1)).toEqual(['a', 'b']);
  });
});
