import Handsontable from 'handsontable/base';
import { NestedHeaders, ManualColumnMove, UndoRedo, registerPlugin } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(NestedHeaders);
registerPlugin(ManualColumnMove);
registerPlugin(UndoRedo);

/**
 * The header tree follows the column order whatever wrote it: a move through ManualColumnMove, a sequence
 * written straight into the column index mapper, and a data load that resets the order.
 */
describe('NestedHeaders – headers follow a column order written without a move', () => {
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
   * Creates a grid of four columns under two groups.
   *
   * @param {object} [settings] Extra grid settings.
   * @returns {object} The Handsontable instance.
   */
  function createGrid(settings = {}) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [['id1', 'name1', 'qty1', 'done1'], ['id2', 'name2', 'qty2', 'done2']],
      manualColumnMove: true,
      ...settings,
      nestedHeaders: [
        [{ label: 'G1', colspan: 2 }, { label: 'G2', colspan: 2 }],
        ['ID', 'Name', 'Qty', 'Done'],
      ],
    });

    return hot;
  }

  /**
   * Reads the labels of one header level, one per visual column.
   *
   * @param {number} level The header level.
   * @returns {string[]}
   */
  function labelsAt(level) {
    return [0, 1, 2, 3].map(column => hot.getColHeader(column, level));
  }

  it('relabels the headers after `setIndexesSequence()` writes a new column order', () => {
    createGrid();

    hot.columnIndexMapper.setIndexesSequence([2, 0, 1, 3]);
    hot.render();

    expect(hot.getDataAtRow(0)).toEqual(['qty1', 'id1', 'name1', 'done1']);
    expect(labelsAt(1)).toEqual(['Qty', 'ID', 'Name', 'Done']);
  });

  it('relabels the headers when a batched sequence write resumes', () => {
    createGrid();

    hot.batch(() => {
      hot.columnIndexMapper.setIndexesSequence([3, 2, 1, 0]);
    });

    expect(labelsAt(1)).toEqual(['Done', 'Qty', 'Name', 'ID']);
  });

  it('relabels the headers when a data load resets a moved column order', () => {
    createGrid();

    hot.getPlugin('manualColumnMove').moveColumn(2, 0);
    hot.render();

    expect(labelsAt(1)).toEqual(['Qty', 'ID', 'Name', 'Done']);

    hot.loadData([['a', 'b', 'c', 'd']]);

    expect(hot.getDataAtRow(0)).toEqual(['a', 'b', 'c', 'd']);
    expect(labelsAt(1)).toEqual(['ID', 'Name', 'Qty', 'Done']);
  });

  it('keeps the headers of a column order written back to the one they were derived for', () => {
    createGrid();

    const sequence = hot.columnIndexMapper.getIndexesSequence().slice();

    hot.columnIndexMapper.setIndexesSequence(sequence);
    hot.render();

    expect(labelsAt(0)).toEqual(['G1', 'G1', 'G2', 'G2']);
    expect(labelsAt(1)).toEqual(['ID', 'Name', 'Qty', 'Done']);
  });

  it('derives the headers of a data load that resets a moved column order once, without a rebuild', () => {
    createGrid();

    hot.getPlugin('manualColumnMove').moveColumn(2, 0);
    hot.render();

    const stateManager = hot.getPlugin('nestedHeaders').getStateManager();
    const rebuildState = jest.spyOn(stateManager, 'rebuildState');
    const setState = jest.spyOn(stateManager, 'setState');

    hot.loadData([['a', 'b', 'c', 'd']]);

    expect(rebuildState).toHaveBeenCalledTimes(0);
    expect(setState).toHaveBeenCalledTimes(1);
    expect(labelsAt(1)).toEqual(['ID', 'Name', 'Qty', 'Done']);
  });

  it('relabels the headers when a sequence written after a data load moves the columns again', () => {
    createGrid();

    hot.getPlugin('manualColumnMove').moveColumn(2, 0);
    hot.render();
    hot.loadData([['a', 'b', 'c', 'd']]);
    hot.columnIndexMapper.setIndexesSequence([2, 0, 1, 3]);
    hot.render();

    expect(hot.getDataAtRow(0)).toEqual(['c', 'a', 'b', 'd']);
    expect(labelsAt(1)).toEqual(['Qty', 'ID', 'Name', 'Done']);
  });

  it('puts the headers back with the data when a column move is undone', () => {
    createGrid({ undoRedo: true });

    hot.getPlugin('manualColumnMove').moveColumn(2, 0);
    hot.render();

    expect(hot.getDataAtRow(0)).toEqual(['qty1', 'id1', 'name1', 'done1']);
    expect(labelsAt(1)).toEqual(['Qty', 'ID', 'Name', 'Done']);

    hot.getPlugin('undoRedo').undo();
    hot.render();

    expect(hot.getDataAtRow(0)).toEqual(['id1', 'name1', 'qty1', 'done1']);
    expect(labelsAt(0)).toEqual(['G1', 'G1', 'G2', 'G2']);
    expect(labelsAt(1)).toEqual(['ID', 'Name', 'Qty', 'Done']);
  });
});
