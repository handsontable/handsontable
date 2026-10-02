import { BaseEditor } from '../baseEditor';

/**
 * Builds the part of an editor the section logic reads: the edited coordinates and a grid that answers
 * the settings and the column and row counts.
 *
 * @param {object} options The grid shape and the edited cell.
 * @param options.row
 * @param options.col
 * @param options.totalRows
 * @param options.totalColumns
 * @param options.fixedColumnsStart
 * @param options.fixedColumnsEnd
 * @param options.fixedRowsTop
 * @param options.fixedRowsBottom
 * @returns {BaseEditor}
 */
function createEditor({
  row,
  col,
  totalRows = 40,
  totalColumns = 10,
  fixedColumnsStart = 0,
  fixedColumnsEnd = 0,
  fixedRowsTop = 0,
  fixedRowsBottom = 0,
}) {
  const editor = Object.create(BaseEditor.prototype);

  editor.row = row;
  editor.col = col;
  editor.hot = {
    countRows: () => totalRows,
    countCols: () => totalColumns,
    getSettings: () => ({ fixedColumnsStart, fixedColumnsEnd, fixedRowsTop, fixedRowsBottom }),
  };

  return editor;
}

describe('BaseEditor#checkEditorSection with fixedColumnsEnd', () => {
  it('should name the inline-end section for a cell of the last columns', () => {
    const shape = { fixedColumnsEnd: 2 };

    expect(createEditor({ ...shape, row: 5, col: 9 }).checkEditorSection()).toBe('inline-end');
    expect(createEditor({ ...shape, row: 5, col: 8 }).checkEditorSection()).toBe('inline-end');
    expect(createEditor({ ...shape, row: 5, col: 7 }).checkEditorSection()).toBe('');
  });

  it('should name the end corners for the cells of the frozen rows in the last columns', () => {
    const shape = { fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2 };

    expect(createEditor({ ...shape, row: 0, col: 9 }).checkEditorSection()).toBe('top-inline-end-corner');
    expect(createEditor({ ...shape, row: 39, col: 8 }).checkEditorSection()).toBe('bottom-inline-end-corner');
    expect(createEditor({ ...shape, row: 0, col: 5 }).checkEditorSection()).toBe('top');
    expect(createEditor({ ...shape, row: 39, col: 5 }).checkEditorSection()).toBe('bottom');
  });

  it('should keep the start sections when the start and end columns are frozen together', () => {
    const shape = { fixedColumnsStart: 2, fixedColumnsEnd: 2, fixedRowsTop: 1, fixedRowsBottom: 1 };

    expect(createEditor({ ...shape, row: 0, col: 1 }).checkEditorSection()).toBe('top-inline-start-corner');
    expect(createEditor({ ...shape, row: 39, col: 0 }).checkEditorSection()).toBe('bottom-inline-start-corner');
    expect(createEditor({ ...shape, row: 5, col: 1 }).checkEditorSection()).toBe('inline-start');
    expect(createEditor({ ...shape, row: 5, col: 9 }).checkEditorSection()).toBe('inline-end');
  });

  it('should give a column that both bands claim to the start band', () => {
    // 10 columns, 8 frozen at the start: the end band asks for 5 but only 2 columns remain for it.
    const shape = { fixedColumnsStart: 8, fixedColumnsEnd: 5 };

    expect(createEditor({ ...shape, row: 5, col: 7 }).checkEditorSection()).toBe('inline-start');
    expect(createEditor({ ...shape, row: 5, col: 8 }).checkEditorSection()).toBe('inline-end');
  });

  it('should not name an end section when no column is frozen at the end', () => {
    expect(createEditor({ row: 5, col: 9 }).checkEditorSection()).toBe('');
  });
});

describe('BaseEditor#getEditedCellsLayerClass with fixedColumnsEnd', () => {
  it('should return the clone class names of the end overlays', () => {
    const shape = { fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2 };

    expect(createEditor({ ...shape, row: 5, col: 9 }).getEditedCellsLayerClass())
      .toBe('ht_clone_inline_end');
    expect(createEditor({ ...shape, row: 0, col: 9 }).getEditedCellsLayerClass())
      .toBe('ht_clone_top_inline_end_corner');
    expect(createEditor({ ...shape, row: 39, col: 9 }).getEditedCellsLayerClass())
      .toBe('ht_clone_bottom_inline_end_corner');
  });

  it('should keep the class names of the start overlays and the master', () => {
    const shape = { fixedColumnsStart: 2, fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2 };

    expect(createEditor({ ...shape, row: 5, col: 0 }).getEditedCellsLayerClass())
      .toBe('ht_clone_left ht_clone_inline_start');
    expect(createEditor({ ...shape, row: 5, col: 5 }).getEditedCellsLayerClass())
      .toBe('ht_clone_master');
  });
});
