import Handsontable from 'handsontable/base';
import { registerPlugin, UndoRedo } from 'handsontable/plugins';

registerPlugin(UndoRedo);

/**
 * `getColHeader()` reads an array `colHeaders` by the physical column index, so an insert has to splice the
 * array at the physical index the created column takes, not at its visual one. The two differ after a column move.
 */
describe('alter("insert_col_*") and an array `colHeaders` after a column move', () => {
  let container;
  let core;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    core?.destroy();
    core = null;
    container.remove();
  });

  /**
   * Builds a one-row grid of four columns whose headers match their values (`A` holds `A1`), then moves a column.
   *
   * @param {number} from The visual index of the column to move.
   * @param {number} to The visual index the column takes.
   * @returns {Handsontable}
   */
  function createMovedGrid(from, to) {
    core = new Handsontable(container, {
      data: [['A1', 'B1', 'C1', 'D1']],
      colHeaders: ['A', 'B', 'C', 'D'],
      undo: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
    core.columnIndexMapper.moveIndexes(from, to);
    core.render();

    return core;
  }

  /**
   * Reads the grid in screen order as `header:value`. The header of a column with no entry in the array reads `?`.
   *
   * @returns {string}
   */
  function show() {
    return Array.from({ length: core.countCols() }, (_, visualColumn) => {
      const physicalColumn = core.toPhysicalColumn(visualColumn);
      const hasHeader = core.getSettings().colHeaders[physicalColumn] !== undefined;

      return `${hasHeader ? core.getColHeader(visualColumn) : '?'}:${core.getDataAtCell(0, visualColumn)}`;
    }).join(' ');
  }

  it('should not shift headers when a column is inserted at the end after moving the first column there', () => {
    createMovedGrid(0, 3);

    expect(show()).toBe('B:B1 C:C1 D:D1 A:A1');

    core.alter('insert_col_end', 3);

    expect(show()).toBe('B:B1 C:C1 D:D1 A:A1 ?:null');
  });

  it('should not shift headers when a column is inserted at the start after moving the first column to the end', () => {
    createMovedGrid(0, 3);
    core.alter('insert_col_start', 0);

    expect(show()).toBe('?:null B:B1 C:C1 D:D1 A:A1');
  });

  it('should keep the headers on their columns for the steps of GitHub issue 10028', () => {
    createMovedGrid(3, 0);

    expect(show()).toBe('D:D1 A:A1 B:B1 C:C1');

    core.alter('insert_col_start', 1);

    expect(show()).toBe('D:D1 ?:null A:A1 B:B1 C:C1');
  });

  it('should not shift headers when a column is inserted in the middle with `insert_col_end`', () => {
    createMovedGrid(3, 0);
    core.alter('insert_col_end', 1);

    expect(show()).toBe('D:D1 A:A1 ?:null B:B1 C:C1');
  });

  it('should insert several empty headers at once', () => {
    createMovedGrid(0, 3);
    core.alter('insert_col_start', 1, 2);

    expect(show()).toBe('B:B1 ?:null ?:null C:C1 D:D1 A:A1');
  });

  it('should keep the headers on their columns when columns are removed after an insert', () => {
    createMovedGrid(0, 3);
    core.alter('insert_col_end', 3);
    core.alter('remove_col', 0);

    expect(show()).toBe('C:C1 D:D1 A:A1 ?:null');

    core.alter('remove_col', 3);

    expect(show()).toBe('C:C1 D:D1 A:A1');
  });

  it('should remove the headers of every removed column when the removed columns are not contiguous physically', () => {
    createMovedGrid(0, 3);
    core.alter('remove_col', 2, 2);

    expect(show()).toBe('B:B1 C:C1');
  });

  it('should remove the headers of the right columns when several groups are removed after a move', () => {
    createMovedGrid(0, 3);
    core.alter('remove_col', [[0, 1], [3, 1]]);

    expect(show()).toBe('C:C1 D:D1');
  });

  it('should show the default label on the new column and the stored header on the moved one', () => {
    createMovedGrid(3, 0);
    core.alter('insert_col_start', 1);

    // The new column has no entry in the array, so it falls back to the spreadsheet label of its position.
    expect(Array.from({ length: core.countCols() }, (_, column) => core.getColHeader(column)))
      .toEqual(['D', 'B', 'A', 'B', 'C']);
  });

  it('should keep the headers on their columns after an undo and a redo of an insert', () => {
    createMovedGrid(0, 3);
    core.alter('insert_col_end', 3);
    core.getPlugin('undoRedo').undo();

    expect(show()).toBe('B:B1 C:C1 D:D1 A:A1');

    core.getPlugin('undoRedo').redo();

    expect(show()).toBe('B:B1 C:C1 D:D1 A:A1 ?:null');
  });

  it('should keep inserting at the end without a move', () => {
    createMovedGrid(0, 0);
    core.alter('insert_col_end', 3);

    expect(show()).toBe('A:A1 B:B1 C:C1 D:D1 ?:null');
  });
});
