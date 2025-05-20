describe('Core_removeCellMeta', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should remove meta for cell', async() => {
    handsontable({
      data: [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [0, 9, 8, 7]
      ]
    });
    const border = {
      top: {

      },
      left: {

      }
    };

    await setCellMeta(0, 0, 'borders', border);
    expect(getCellMeta(0, 0).borders).toEqual(border);

    removeCellMeta(0, 0, 'borders');
    expect(getCellMeta(0, 0).borders).toBeUndefined();
  });

  it('should remove proper cell meta when indexes was modified', async() => {
    handsontable({
      minRows: 5,
      minCols: 5
    });

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    await setCellMeta(0, 0, 'key', 'value');
    removeCellMeta(0, 0, 'key');

    expect(getCellMeta(0, 0).key).toBeUndefined();
  });

  it('should trigger `beforeRemoveCellMeta` hook with proper parameters', async() => {
    const beforeRemoveCellMeta = jasmine.createSpy('beforeRemoveCellMeta');

    handsontable({
      data: [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [0, 9, 8, 7]
      ],
      beforeRemoveCellMeta
    });

    await setCellMeta(0, 0, 'key', 'value');
    removeCellMeta(0, 0, 'key');

    expect(beforeRemoveCellMeta).toHaveBeenCalledWith(0, 0, 'key', 'value');
  });

  it('should trigger `afterRemoveCellMeta` hook with proper parameters - case 1 (removed `key` existed)', async() => {
    const afterRemoveCellMeta = jasmine.createSpy('afterRemoveCellMeta');

    handsontable({
      data: [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [0, 9, 8, 7]
      ],
      afterRemoveCellMeta
    });

    await setCellMeta(0, 0, 'key', 'value');
    removeCellMeta(0, 0, 'key');

    expect(afterRemoveCellMeta).toHaveBeenCalledWith(0, 0, 'key', 'value');
  });

  it('should trigger `afterRemoveCellMeta` hook with proper parameters - case 2  (removed `key` not existed)', async() => {
    const afterRemoveCellMeta = jasmine.createSpy('afterRemoveCellMeta');

    handsontable({
      data: [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [0, 9, 8, 7]
      ],
      afterRemoveCellMeta
    });

    removeCellMeta(0, 0, 'key');

    expect(afterRemoveCellMeta).toHaveBeenCalledWith(0, 0, 'key');
  });

  it('should call `beforeRemoveCellMeta` plugin hook with visual indexes as parameters', async() => {
    let rowInsideHook;
    let colInsideHook;

    handsontable({
      minRows: 5,
      minCols: 5,
      beforeRemoveCellMeta(row, col) {
        rowInsideHook = row;
        colInsideHook = col;
      }
    });

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    removeCellMeta(0, 1, 'key');

    expect(rowInsideHook).toEqual(0);
    expect(colInsideHook).toEqual(1);
  });

  it('should call `afterRemoveCellMeta` plugin hook with visual indexes as parameters', async() => {
    let rowInsideHook;
    let colInsideHook;

    handsontable({
      minRows: 5,
      minCols: 5,
      afterRemoveCellMeta(row, col) {
        rowInsideHook = row;
        colInsideHook = col;
      }
    });

    rowIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    removeCellMeta(0, 1, 'key');

    expect(rowInsideHook).toEqual(0);
    expect(colInsideHook).toEqual(1);
  });

  it('should block removing cell meta when hook `beforeRemoveCellMeta` return false', async() => {
    handsontable({
      beforeRemoveCellMeta(row, col) {
        if (row === 0 && col === 0) {
          return false;
        }

        return true;
      }
    });

    await setCellMeta(0, 0, 'key', 'value');
    await setCellMeta(0, 1, 'key', 'value');

    removeCellMeta(0, 0, 'key');
    removeCellMeta(0, 1, 'key');

    // `value` shouldn't be removed
    expect(getCellMeta(0, 0).key).toEqual('value');
    expect(getCellMeta(0, 1).key).toBeUndefined();
  });
});
