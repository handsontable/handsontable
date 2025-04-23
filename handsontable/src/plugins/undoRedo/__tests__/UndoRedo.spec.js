describe('UndoRedo', () => {
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

  it('should exposed new methods when plugin is enabled', async() => {
    const hot = handsontable({
      undo: false
    });

    expect(hot.undo).toBeUndefined();
    expect(hot.redo).toBeUndefined();
    expect(hot.isUndoAvailable).toBeUndefined();
    expect(hot.isRedoAvailable).toBeUndefined();
    expect(hot.clearUndo).toBeUndefined();

    await updateSettings({
      undo: true
    });

    expect(typeof hot.undo).toEqual('function');
    expect(typeof hot.redo).toEqual('function');
    expect(typeof hot.isUndoAvailable).toEqual('function');
    expect(typeof hot.isRedoAvailable).toEqual('function');
    expect(typeof hot.clearUndo).toEqual('function');
  });

  it('should remove exposed methods when plugin is disabled', async() => {
    const hot = handsontable({
      undo: true
    });

    expect(typeof hot.undo).toEqual('function');
    expect(typeof hot.redo).toEqual('function');
    expect(typeof hot.isUndoAvailable).toEqual('function');
    expect(typeof hot.isRedoAvailable).toEqual('function');
    expect(typeof hot.clearUndo).toEqual('function');

    await updateSettings({
      undo: false
    });

    expect(hot.undo).toBeUndefined();
    expect(hot.redo).toBeUndefined();
    expect(hot.isUndoAvailable).toBeUndefined();
    expect(hot.isRedoAvailable).toBeUndefined();
    expect(hot.clearUndo).toBeUndefined();
  });

  it('should not undo changes in the other cells if editor is open', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2),
    });

    await selectCell(0, 0);
    await setDataAtCell(0, 0, 'new value');

    await selectCell(1, 0);
    await keyDownUp('enter');
    await keyDownUp(['control/meta', 'z']);

    expect(getDataAtCell(0, 0)).toBe('new value');
  });

  describe('updateSettings', () => {
    it('should be possible to enable the undo/redo feature', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        undo: false,
      });

      await setDataAtCell(0, 0, 'X1');

      await updateSettings({
        undo: true,
      });

      await setDataAtCell(0, 0, 'X2');

      getPlugin('undoRedo').undo();

      expect(getDataAtCell(0, 0)).toBe('X1');

      getPlugin('undoRedo').redo();

      expect(getDataAtCell(0, 0)).toBe('X2');
    });

    it('should be possible to disable the undo/redo feature', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        undo: true,
      });

      await setDataAtCell(0, 0, 'X2');

      getPlugin('undoRedo').undo();

      expect(getDataAtCell(0, 0)).toBe('A1');

      getPlugin('undoRedo').redo();

      expect(getDataAtCell(0, 0)).toBe('X2');

      await updateSettings({
        undo: false,
      });

      await setDataAtCell(1, 1, 'X2');

      getPlugin('undoRedo').undo();

      expect(getDataAtCell(1, 1)).toBe('B2');
    });
  });

  describe('Array data', () => {
    describe('undo', () => {
      it('should undo single change', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        await setDataAtCell(0, 0, 'X1');
        expect(getDataAtCell(0, 0)).toBe('X1');

        getPlugin('undoRedo').undo();
        expect(getDataAtCell(0, 0)).toBe('A1');
      });

      it('should undo creation of a single row', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        expect(countRows()).toEqual(2);

        await alter('insert_row_above');

        expect(countRows()).toEqual(3);

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(2);
      });

      it('should undo creation of multiple rows', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        expect(countRows()).toEqual(2);

        await alter('insert_row_above', 0, 5);

        expect(countRows()).toEqual(7);

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(2);
      });

      it('should undo creation of multiple rows with minSpareRows', async() => {
        handsontable({
          data: createSpreadsheetData(2, 1),
          minSpareRows: 2
        });

        await setDataAtCell(2, 0, 'A3');
        await setDataAtCell(4, 0, 'A4');

        expect(getData()).toEqual([['A1'], ['A2'], ['A3'], [null], ['A4'], [null], [null]]);

        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();

        expect(getData()).toEqual([['A1'], ['A2'], [null], [null]]);
      });

      it('should undo and redo dataset change that expands the table with minSpareRows (#dev-381)', async() => {
        handsontable({
          data: createSpreadsheetData(3, 3),
          minSpareRows: 2,
        });

        await setDataAtCell([
          [4, 0, 'A1'], [4, 1, 'B1'],
          [5, 0, 'A2'], [5, 1, 'B2'],
          [6, 0, 'A3'], [6, 1, 'B3'],
        ]);

        getPlugin('undoRedo').undo();

        expect(getData()).toEqual([
          ['A1', 'B1', 'C1'],
          ['A2', 'B2', 'C2'],
          ['A3', 'B3', 'C3'],
          [null, null, null],
          [null, null, null],
        ]);

        getPlugin('undoRedo').redo();

        expect(getData()).toEqual([
          ['A1', 'B1', 'C1'],
          ['A2', 'B2', 'C2'],
          ['A3', 'B3', 'C3'],
          [null, null, null],
          ['A1', 'B1', null],
          ['A2', 'B2', null],
          ['A3', 'B3', null],
          [null, null, null],
          [null, null, null],
        ]);
      });

      it('should undo removal of single row', async() => {
        handsontable({
          data: createSpreadsheetData(3, 2)
        });

        expect(countRows()).toEqual(3);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');

        await alter('remove_row', 1);

        expect(countRows()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A3');
        expect(getDataAtCell(1, 1)).toEqual('B3');

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(3);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');
      });

      it('should undo removal of multiple rows', async() => {
        handsontable({
          data: createSpreadsheetData(4, 2)
        });

        expect(countRows()).toEqual(4);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');
        expect(getDataAtCell(3, 0)).toEqual('A4');
        expect(getDataAtCell(3, 1)).toEqual('B4');

        await alter('remove_row', 1, 2);

        expect(countRows()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A4');
        expect(getDataAtCell(1, 1)).toEqual('B4');

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(4);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');
        expect(getDataAtCell(3, 0)).toEqual('A4');
        expect(getDataAtCell(3, 1)).toEqual('B4');
      });

      it('should undo removal all rows', async() => {
        handsontable({
          data: createSpreadsheetData(4, 2)
        });

        await alter('remove_row', 0, 4);

        expect(countRows()).toBe(0);
        expect(countCols()).toBe(0);
        expect(getData()).toEqual([]);
        expect(getSourceData()).toEqual([]);
        expect(getDataAtCell(0, 0)).toBeNull();

        getPlugin('undoRedo').undo();

        expect(countRows()).toBe(4);
        expect(countCols()).toBe(2);
        expect(getDataAtCell(0, 0)).toBe('A1');
        expect(getDataAtCell(0, 1)).toBe('B1');
        expect(getDataAtCell(1, 0)).toBe('A2');
        expect(getDataAtCell(1, 1)).toBe('B2');
        expect(getDataAtCell(2, 0)).toBe('A3');
        expect(getDataAtCell(2, 1)).toBe('B3');
        expect(getDataAtCell(3, 0)).toBe('A4');
        expect(getDataAtCell(3, 1)).toBe('B4');
      });

      it('should undo removal of single row after column sorting', async() => {
        handsontable({
          data: createSpreadsheetData(3, 2),
          colHeaders: true,
          columnSorting: true
        });

        expect(countRows()).toEqual(3);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');

        getPlugin('ColumnSorting').sort({ column: 0, sortOrder: 'desc' });

        expect(countRows()).toEqual(3);
        expect(getDataAtCell(0, 0)).toEqual('A3');
        expect(getDataAtCell(0, 1)).toEqual('B3');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A1');
        expect(getDataAtCell(2, 1)).toEqual('B1');

        await alter('remove_row', 0);

        expect(countRows()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A2');
        expect(getDataAtCell(0, 1)).toEqual('B2');
        expect(getDataAtCell(1, 0)).toEqual('A1');
        expect(getDataAtCell(1, 1)).toEqual('B1');

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(3);
        expect(getDataAtCell(0, 0)).toEqual('A3');
        expect(getDataAtCell(0, 1)).toEqual('B3');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A1');
        expect(getDataAtCell(2, 1)).toEqual('B1');
      });

      it('should undo the removal of rows when the instance is configured with the `columns` option', async() => {
        handsontable({
          data: createSpreadsheetData(3, 3),
          columns: [
            { data: 1 }
          ]
        });

        await alter('remove_row', 0, 3);

        expect(countRows()).toEqual(0);
        expect(countSourceRows()).toEqual(0);
        expect(countCols()).toEqual(1);
        expect(countSourceCols()).toEqual(0);

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(3);
        expect(countSourceRows()).toEqual(3);
        expect(countCols()).toEqual(1);
        expect(countSourceCols()).toEqual(3);

        expect(getData(0, 0, 2, 0)).toEqual([
          ['B1'], ['B2'], ['B3']
        ]);

        expect(getSourceData(0, 0, 2, 2)).toEqual([
          ['A1', 'B1', 'C1'],
          ['A2', 'B2', 'C2'],
          ['A3', 'B3', 'C3'],
        ]);
      });

      it('should undo creation of a single column (colHeaders: undefined)', async() => {
        handsontable({
          data: createSpreadsheetData(2, 3)
        });

        expect(countCols()).toEqual(3);

        await alter('insert_col_start');

        expect(countCols()).toEqual(4);

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(3);
      });

      it('should undo creation of a single column (colHeaders: true)', async() => {
        handsontable({
          data: createSpreadsheetData(2, 3),
          colHeaders: true
        });

        expect(countCols()).toEqual(3);
        expect(getColHeader()).toEqual(['A', 'B', 'C']);

        await alter('insert_col_start');

        expect(countCols()).toEqual(4);
        expect(getColHeader()).toEqual(['A', 'B', 'C', 'D']);

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(3);
        expect(getColHeader()).toEqual(['A', 'B', 'C']);
      });

      it('should undo creation of a single column (colHeaders: Array)', async() => {
        handsontable({
          data: createSpreadsheetData(2, 3),
          colHeaders: ['Header1', 'Header2', 'Header3']
        });

        expect(countCols()).toEqual(3);
        expect(getColHeader()).toEqual(['Header1', 'Header2', 'Header3']);

        await alter('insert_col_start', 1);

        expect(countCols()).toEqual(4);
        expect(getColHeader()).toEqual(['Header1', 'B', 'Header2', 'Header3']);

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(3);
        expect(getColHeader()).toEqual(['Header1', 'Header2', 'Header3']);
      });

      it('should undo creation of multiple columns (colHeaders: undefined)', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        expect(countCols()).toEqual(2);

        await alter('insert_col_start', 1, 5);

        expect(countCols()).toEqual(7);

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(2);
      });

      it('should undo creation of multiple columns (colHeaders: true)', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2),
          colHeaders: true
        });

        expect(countCols()).toEqual(2);
        expect(getColHeader()).toEqual(['A', 'B']);

        await alter('insert_col_start', 1, 5);

        expect(countCols()).toEqual(7);
        expect(getColHeader()).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(2);
        expect(getColHeader()).toEqual(['A', 'B']);
      });

      it('should undo creation of multiple columns (colHeaders: Array)', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2),
          colHeaders: ['Header1', 'Header2']
        });

        expect(countCols()).toEqual(2);
        expect(getColHeader()).toEqual(['Header1', 'Header2']);

        await alter('insert_col_start', 1, 5);

        expect(countCols()).toEqual(7);
        expect(getColHeader()).toEqual(['Header1', 'B', 'C', 'D', 'E', 'F', 'Header2']);

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(2);
        expect(getColHeader()).toEqual(['Header1', 'Header2']);
      });

      it('should undo creation of multiple columns with minSpareCols', async() => {
        handsontable({
          data: createSpreadsheetData(1, 1),
          minSpareCols: 2
        });

        await setDataAtCell(0, 1, 'B1');
        await setDataAtCell(0, 3, 'C1');

        expect(getData()).toEqual([['A1', 'B1', null, 'C1', null, null]]);

        getPlugin('undoRedo').undo();

        expect(getData()).toEqual([['A1', 'B1', null, null]]);

        getPlugin('undoRedo').undo();

        expect(getData()).toEqual([['A1', null, null]]);
      });

      it('should undo removal of multiple columns with minSpareCols', async() => {
        handsontable({
          data: createSpreadsheetData(1, 2),
          minSpareCols: 1,
        });

        await selectColumns(0, 2);
        await alter('remove_col', 0, 3);
        getPlugin('undoRedo').undo();

        expect(getSelected()).toBeUndefined();
        expect(countCols()).toBe(3);
        expect(getData()).toEqual([
          ['A1', 'B1', null],
        ]);
      });

      it('should undo and redo dataset change that expands the table with minSpareCols (#dev-381)', async() => {
        handsontable({
          data: createSpreadsheetData(3, 3),
          minSpareCols: 2,
        });

        await setDataAtCell([
          [0, 4, 'A1'], [0, 5, 'B1'],
          [1, 4, 'A2'], [1, 5, 'B2'],
          [2, 4, 'A3'], [2, 5, 'B3'],
        ]);

        getPlugin('undoRedo').undo();

        expect(getData()).toEqual([
          ['A1', 'B1', 'C1', null, null],
          ['A2', 'B2', 'C2', null, null],
          ['A3', 'B3', 'C3', null, null],
        ]);

        getPlugin('undoRedo').redo();

        expect(getData()).toEqual([
          ['A1', 'B1', 'C1', null, 'A1', 'B1', null, null],
          ['A2', 'B2', 'C2', null, 'A2', 'B2', null, null],
          ['A3', 'B3', 'C3', null, 'A3', 'B3', null, null],
        ]);
      });

      it('should undo removal of single column (colHeaders: undefined)', async() => {
        handsontable({
          data: createSpreadsheetData(2, 3)
        });

        expect(countCols()).toEqual(3);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(0, 2)).toEqual('C1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(1, 2)).toEqual('C2');

        await alter('remove_col', 1);

        expect(countCols()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('C1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('C2');

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(3);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(0, 2)).toEqual('C1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(1, 2)).toEqual('C2');
      });

      it('should undo removal of single column (colHeaders: true)', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2),
          colHeaders: true
        });

        expect(countCols()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getColHeader()).toEqual(['A', 'B']);

        await alter('remove_col');

        expect(countCols()).toEqual(1);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toBeNull();
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toBeNull();
        expect(getColHeader()).toEqual(['A']);

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');

        expect(getColHeader()).toEqual(['A', 'B']);
      });

      it('should undo removal of single column (colHeaders: Array)', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2),
          colHeaders: ['Header1', 'Header2']
        });

        expect(countCols()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getColHeader()).toEqual(['Header1', 'Header2']);

        await alter('remove_col');

        expect(countCols()).toEqual(1);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toBeNull();
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toBeNull();
        expect(getColHeader()).toEqual(['Header1']);

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');

        expect(getColHeader()).toEqual(['Header1', 'Header2']);
      });

      it('should undo removal of multiple columns (colHeaders: undefined)', async() => {
        handsontable({
          data: createSpreadsheetData(1, 15)
        });

        expect(countCols()).toEqual(15);
        expect(getData()).toEqual([
          ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1', 'N1', 'O1']
        ]);

        await alter('remove_col', 4, 7);

        expect(getData()).toEqual([
          ['A1', 'B1', 'C1', 'D1', 'L1', 'M1', 'N1', 'O1']
        ]);

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(15);
        expect(getData()).toEqual([
          ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1', 'N1', 'O1']
        ]);
      });

      it('should undo removal of multiple columns (colHeaders: true)', async() => {
        handsontable({
          data: createSpreadsheetData(2, 4),
          colHeaders: true
        });

        expect(countCols()).toEqual(4);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(0, 2)).toEqual('C1');
        expect(getDataAtCell(0, 3)).toEqual('D1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(1, 2)).toEqual('C2');
        expect(getDataAtCell(1, 3)).toEqual('D2');
        expect(getColHeader()).toEqual(['A', 'B', 'C', 'D']);

        await alter('remove_col', 1, 3);

        expect(countCols()).toEqual(1);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toBeNull();
        expect(getDataAtCell(0, 2)).toBeNull();
        expect(getDataAtCell(0, 3)).toBeNull();
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toBeNull();
        expect(getDataAtCell(1, 2)).toBeNull();
        expect(getDataAtCell(1, 3)).toBeNull();
        expect(getColHeader()).toEqual(['A']);

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(4);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(0, 2)).toEqual('C1');
        expect(getDataAtCell(0, 3)).toEqual('D1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(1, 2)).toEqual('C2');
        expect(getDataAtCell(1, 3)).toEqual('D2');
        expect(getColHeader()).toEqual(['A', 'B', 'C', 'D']);
      });

      it('should undo removal of multiple columns (colHeaders: Array)', async() => {
        handsontable({
          data: createSpreadsheetData(2, 4),
          colHeaders: ['Header1', 'Header2', 'Header3', 'Header4']
        });

        expect(countCols()).toEqual(4);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(0, 2)).toEqual('C1');
        expect(getDataAtCell(0, 3)).toEqual('D1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(1, 2)).toEqual('C2');
        expect(getDataAtCell(1, 3)).toEqual('D2');
        expect(getColHeader()).toEqual(['Header1', 'Header2', 'Header3', 'Header4']);

        await alter('remove_col', 1, 2);

        expect(countCols()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('D1');
        expect(getDataAtCell(0, 2)).toBeNull();
        expect(getDataAtCell(0, 3)).toBeNull();
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('D2');
        expect(getDataAtCell(1, 2)).toBeNull();
        expect(getDataAtCell(1, 3)).toBeNull();
        expect(getColHeader()).toEqual(['Header1', 'Header4']);

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(4);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(0, 2)).toEqual('C1');
        expect(getDataAtCell(0, 3)).toEqual('D1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(1, 2)).toEqual('C2');
        expect(getDataAtCell(1, 3)).toEqual('D2');
        expect(getColHeader()).toEqual(['Header1', 'Header2', 'Header3', 'Header4']);
      });

      it('should undo removal all columns', async() => {
        handsontable({
          data: createSpreadsheetData(2, 4),
          colHeaders: ['Header1', 'Header2', 'Header3', 'Header4'],
          contextMenu: true,
        });

        await alter('remove_col', 0, 4);

        expect(countRows()).toBe(0);
        expect(countCols()).toBe(0);
        expect(getDataAtCell(0, 0)).toBeNull();
        expect(getData()).toEqual([]);
        expect(getSourceData()).toEqual([[], []]);

        getPlugin('undoRedo').undo();

        expect(countRows()).toBe(2);
        expect(countCols()).toBe(4);
        expect(getDataAtCell(0, 0)).toBe('A1');
        expect(getDataAtCell(0, 1)).toBe('B1');
        expect(getDataAtCell(0, 2)).toBe('C1');
        expect(getDataAtCell(0, 3)).toBe('D1');
        expect(getDataAtCell(1, 0)).toBe('A2');
        expect(getDataAtCell(1, 1)).toBe('B2');
        expect(getDataAtCell(1, 2)).toBe('C2');
        expect(getDataAtCell(1, 3)).toBe('D2');
        expect(getColHeader()).toEqual(['Header1', 'Header2', 'Header3', 'Header4']);
      });

      xit('should undo removal of multiple columns (with a used manualColumnMove)', async() => {
        handsontable({
          data: createSpreadsheetData(2, 7),
          manualColumnMove: [3, 2, 0, 6, 1, 5, 4]
        });

        expect(countCols()).toEqual(7);
        expect(getDataAtRow(0)).toEqual(['D1', 'C1', 'A1', 'G1', 'B1', 'F1', 'E1']);

        await alter('remove_col', 1, 3);

        expect(countCols()).toEqual(4);
        expect(getDataAtRow(0)).toEqual(['D1', 'B1', 'F1', 'E1']);

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(7);
        expect(getDataAtRow(0)).toEqual(['D1', 'C1', 'A1', 'G1', 'B1', 'F1', 'E1']);
      });

      it('should undo multiple changes', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        await setDataAtCell(0, 0, 'X1');
        await setDataAtCell(1, 0, 'X2');
        await setDataAtCell(0, 1, 'Y1');
        await setDataAtCell(1, 1, 'Y2');

        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('X2');
        expect(getDataAtCell(0, 1)).toBe('Y1');
        expect(getDataAtCell(1, 1)).toBe('Y2');

        getPlugin('undoRedo').undo();
        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('X2');
        expect(getDataAtCell(0, 1)).toBe('Y1');
        expect(getDataAtCell(1, 1)).toBe('B2');

        getPlugin('undoRedo').undo();
        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('X2');
        expect(getDataAtCell(0, 1)).toBe('B1');
        expect(getDataAtCell(1, 1)).toBe('B2');

        getPlugin('undoRedo').undo();
        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('A2');
        expect(getDataAtCell(0, 1)).toBe('B1');
        expect(getDataAtCell(1, 1)).toBe('B2');

        getPlugin('undoRedo').undo();
        expect(getDataAtCell(0, 0)).toBe('A1');
        expect(getDataAtCell(1, 0)).toBe('A2');
        expect(getDataAtCell(0, 1)).toBe('B1');
        expect(getDataAtCell(1, 1)).toBe('B2');

        getPlugin('undoRedo').undo();
        expect(getDataAtCell(0, 0)).toBe('A1');
        expect(getDataAtCell(1, 0)).toBe('A2');
        expect(getDataAtCell(0, 1)).toBe('B1');
        expect(getDataAtCell(1, 1)).toBe('B2');
      });

      it('should undo multiple changes in cells with validators', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2),
          validator: /^[A-Z]+[0-9]+$/
        });

        await setDataAtCell(0, 0, 'X1');
        await setDataAtCell(1, 0, 'X2');
        await setDataAtCell(0, 1, 'Y1');

        await sleep(10);

        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('X2');
        expect(getDataAtCell(0, 1)).toBe('Y1');

        getPlugin('undoRedo').undo();

        await sleep(10);

        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('X2');
        expect(getDataAtCell(0, 1)).toBe('B1');

        getPlugin('undoRedo').undo();

        await sleep(10);

        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('A2');
        expect(getDataAtCell(0, 1)).toBe('B1');

        getPlugin('undoRedo').undo();

        await sleep(10);

        expect(getDataAtCell(0, 0)).toBe('A1');
        expect(getDataAtCell(1, 0)).toBe('A2');
        expect(getDataAtCell(0, 1)).toBe('B1');
      });

      it('should undo multiple row creations', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        expect(countRows()).toEqual(2);

        await alter('insert_row_above');
        await alter('insert_row_above');
        await alter('insert_row_above');
        await alter('insert_row_above');

        expect(countRows()).toEqual(6);

        getPlugin('undoRedo').undo();
        expect(countRows()).toEqual(5);

        getPlugin('undoRedo').undo();
        expect(countRows()).toEqual(4);

        getPlugin('undoRedo').undo();
        expect(countRows()).toEqual(3);

        getPlugin('undoRedo').undo();
        expect(countRows()).toEqual(2);

        getPlugin('undoRedo').undo();
        expect(countRows()).toEqual(2);
      });

      it('should undo multiple row removals', async() => {
        handsontable({
          data: createSpreadsheetData(4, 2)
        });

        expect(countRows()).toEqual(4);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');
        expect(getDataAtCell(3, 0)).toEqual('A4');
        expect(getDataAtCell(3, 1)).toEqual('B4');

        await alter('remove_row');
        await alter('remove_row');
        await alter('remove_row');

        expect(countRows()).toEqual(1);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');

        getPlugin('undoRedo').undo();
        expect(countRows()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');

        getPlugin('undoRedo').undo();
        expect(countRows()).toEqual(3);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');

        getPlugin('undoRedo').undo();
        expect(countRows()).toEqual(4);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');
        expect(getDataAtCell(3, 0)).toEqual('A4');
        expect(getDataAtCell(3, 1)).toEqual('B4');

        getPlugin('undoRedo').undo();
        expect(countRows()).toEqual(4);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');
        expect(getDataAtCell(3, 0)).toEqual('A4');
        expect(getDataAtCell(3, 1)).toEqual('B4');
      });

      it('should undo changes only for table where the change actually took place', async() => {
        spec().$container2 = $(`<div id="${id}-2"></div>`).appendTo('body');

        const hot1 = handsontable({
          data: [
            [1],
            [2],
            [3]
          ]
        });

        spec().$container2.handsontable({
          data: [
            ['A'],
            ['B'],
            ['C']
          ]
        });

        const hot2 = spec().$container2.handsontable('getInstance');

        hot1.setDataAtCell(0, 0, 4);
        expect(hot1.getDataAtCell(0, 0)).toEqual(4);
        expect(hot2.getDataAtCell(0, 0)).toEqual('A');

        hot2.getPlugin('undoRedo').undo();
        expect(hot2.getDataAtCell(0, 0)).toEqual('A');
        expect(hot1.getDataAtCell(0, 0)).toEqual(4);

        hot1.getPlugin('undoRedo').undo();
        expect(hot2.getDataAtCell(0, 0)).toEqual('A');
        expect(hot1.getDataAtCell(0, 0)).toEqual(1);

        hot2.destroy();
        spec().$container2.remove();
      });

      it('should return the right amount after undo removal of single column', async() => {
        handsontable({
          data: createSpreadsheetData(2, 3)
        });

        const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');

        addHook('afterCreateCol', afterCreateColCallback);

        expect(countCols()).toEqual(3);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(0, 2)).toEqual('C1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(1, 2)).toEqual('C2');

        await alter('remove_col', 1);

        expect(countCols()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('C1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('C2');

        getPlugin('undoRedo').undo();

        expect(afterCreateColCallback).toHaveBeenCalledOnceWith(1, 1, 'UndoRedo.undo');

        expect(countCols()).toEqual(3);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(0, 2)).toEqual('C1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(1, 2)).toEqual('C2');
      });

      it('should work with functional data source', async() => {
        handsontable({
          data: [
            model({ id: 1, name: 'Ted Right', address: '' }),
            model({ id: 2, name: 'Frank Honest', address: '' }),
            model({ id: 3, name: 'Joan Well', address: '' })
          ],
          dataSchema: model,
          startRows: 5,
          startCols: 3,
          colHeaders: ['ID', 'Name', 'Address'],
          columns: [
            { data: property('id') },
            { data: property('name') },
            { data: property('address') }
          ],
          minSpareRows: 1
        });

        /**
         * @param opts
         */
        function model(opts) {
          const _pub = {};
          const _priv = $.extend({
            id: undefined,
            name: undefined,
            address: undefined
          }, opts);

          _pub.attr = function(attr, val) {
            if (typeof val === 'undefined') {
              return _priv[attr];
            }
            _priv[attr] = val;

            return _pub;
          };

          return _pub;
        }

        /**
         * @param attr
         */
        function property(attr) {
          return function(row, value) {
            return row.attr(attr, value);
          };
        }

        expect(getDataAtCell(1, 1)).toEqual('Frank Honest');
        await setDataAtCell(1, 1, 'Something Else');
        expect(getDataAtCell(1, 1)).toEqual('Something Else');

        getPlugin('undoRedo').undo();
        expect(getDataAtCell(1, 1)).toEqual('Frank Honest');
      });
    });

    describe('redo', () => {
      it('should redo single change', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        await setDataAtCell(0, 0, 'new value');

        expect(getDataAtCell(0, 0)).toBe('new value');

        getPlugin('undoRedo').undo();
        expect(getDataAtCell(0, 0)).toBe('A1');

        getPlugin('undoRedo').redo();
        expect(getDataAtCell(0, 0)).toBe('new value');
      });

      it('should redo single change in cell with validator', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2),
          validator: /^[A-Z]+[0-9]+$/
        });

        await setDataAtCell(0, 0, 'X1');
        await setDataAtCell(1, 0, 'X2');
        await setDataAtCell(0, 1, 'Y1');

        await sleep(10);
        getPlugin('undoRedo').undo();
        await sleep(10);
        getPlugin('undoRedo').undo();
        await sleep(10);
        getPlugin('undoRedo').undo();
        await sleep(10);
        getPlugin('undoRedo').redo();
        await sleep(10);

        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('A2');
        expect(getDataAtCell(0, 1)).toBe('B1');

        getPlugin('undoRedo').redo();
        await sleep(10);

        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('X2');
        expect(getDataAtCell(0, 1)).toBe('B1');

        getPlugin('undoRedo').redo();
        await sleep(10);

        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('X2');
        expect(getDataAtCell(0, 1)).toBe('Y1');
      });

      it('should redo creation of a single row', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        expect(countRows()).toEqual(2);

        await alter('insert_row_above');

        expect(countRows()).toEqual(3);

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(2);

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(3);
      });

      it('should redo creation of multiple rows', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        expect(countRows()).toEqual(2);

        await alter('insert_row_above', 0, 5);

        expect(countRows()).toEqual(7);

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(2);

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(7);
      });

      it('should redo removal of single row', async() => {
        handsontable({
          data: createSpreadsheetData(3, 2)
        });

        expect(countRows()).toEqual(3);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');

        await alter('remove_row', 1);

        expect(countRows()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A3');
        expect(getDataAtCell(1, 1)).toEqual('B3');

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(3);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A3');
        expect(getDataAtCell(1, 1)).toEqual('B3');
      });

      it('should redo removal of multiple rows', async() => {
        handsontable({
          data: createSpreadsheetData(4, 2)
        });

        expect(countRows()).toEqual(4);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');
        expect(getDataAtCell(3, 0)).toEqual('A4');
        expect(getDataAtCell(3, 1)).toEqual('B4');

        await alter('remove_row', 1, 2);

        expect(countRows()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A4');
        expect(getDataAtCell(1, 1)).toEqual('B4');

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(4);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');
        expect(getDataAtCell(3, 0)).toEqual('A4');
        expect(getDataAtCell(3, 1)).toEqual('B4');

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A4');
        expect(getDataAtCell(1, 1)).toEqual('B4');
      });

      it('should redo creation of a single column', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        expect(countCols()).toEqual(2);

        await alter('insert_col_start');

        expect(countCols()).toEqual(3);

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(2);

        getPlugin('undoRedo').redo();

        expect(countCols()).toEqual(3);
      });

      it('should redo creation of multiple columns', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        expect(countCols()).toEqual(2);

        await alter('insert_col_start', 1, 5);

        expect(countCols()).toEqual(7);

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(2);

        getPlugin('undoRedo').redo();

        expect(countCols()).toEqual(7);
      });

      it('should redo removal of single column', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        expect(countCols()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');

        await alter('remove_col');

        expect(countCols()).toEqual(1);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toBeNull();
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toBeNull();

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');

        getPlugin('undoRedo').redo();

        expect(countCols()).toEqual(1);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toBeNull();
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toBeNull();
      });

      it('should redo removal of multiple columns', async() => {
        handsontable({
          data: createSpreadsheetData(2, 4)
        });

        expect(countCols()).toEqual(4);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(0, 2)).toEqual('C1');
        expect(getDataAtCell(0, 3)).toEqual('D1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(1, 2)).toEqual('C2');
        expect(getDataAtCell(1, 3)).toEqual('D2');

        await alter('remove_col', 1, 3);

        expect(countCols()).toEqual(1);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toBeNull();
        expect(getDataAtCell(0, 2)).toBeNull();
        expect(getDataAtCell(0, 3)).toBeNull();
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toBeNull();
        expect(getDataAtCell(1, 2)).toBeNull();
        expect(getDataAtCell(1, 3)).toBeNull();

        getPlugin('undoRedo').undo();

        expect(countCols()).toEqual(4);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(0, 2)).toEqual('C1');
        expect(getDataAtCell(0, 3)).toEqual('D1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(1, 2)).toEqual('C2');
        expect(getDataAtCell(1, 3)).toEqual('D2');

        getPlugin('undoRedo').redo();

        expect(countCols()).toEqual(1);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toBeNull();
        expect(getDataAtCell(0, 2)).toBeNull();
        expect(getDataAtCell(0, 3)).toBeNull();
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toBeNull();
        expect(getDataAtCell(1, 2)).toBeNull();
        expect(getDataAtCell(1, 3)).toBeNull();
      });

      it('should redo multiple changes', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        await setDataAtCell(0, 0, 'X1');
        await setDataAtCell(1, 0, 'X2');
        await setDataAtCell(0, 1, 'Y1');
        await setDataAtCell(1, 1, 'Y2');

        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('X2');
        expect(getDataAtCell(0, 1)).toBe('Y1');
        expect(getDataAtCell(1, 1)).toBe('Y2');

        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();

        expect(getDataAtCell(0, 0)).toBe('A1');
        expect(getDataAtCell(1, 0)).toBe('A2');
        expect(getDataAtCell(0, 1)).toBe('B1');
        expect(getDataAtCell(1, 1)).toBe('B2');

        getPlugin('undoRedo').redo();
        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('A2');
        expect(getDataAtCell(0, 1)).toBe('B1');
        expect(getDataAtCell(1, 1)).toBe('B2');

        getPlugin('undoRedo').redo();
        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('X2');
        expect(getDataAtCell(0, 1)).toBe('B1');
        expect(getDataAtCell(1, 1)).toBe('B2');

        getPlugin('undoRedo').redo();
        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('X2');
        expect(getDataAtCell(0, 1)).toBe('Y1');
        expect(getDataAtCell(1, 1)).toBe('B2');

        getPlugin('undoRedo').redo();
        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('X2');
        expect(getDataAtCell(0, 1)).toBe('Y1');
        expect(getDataAtCell(1, 1)).toBe('Y2');

        getPlugin('undoRedo').redo();
        expect(getDataAtCell(0, 0)).toBe('X1');
        expect(getDataAtCell(1, 0)).toBe('X2');
        expect(getDataAtCell(0, 1)).toBe('Y1');
        expect(getDataAtCell(1, 1)).toBe('Y2');
      });

      it('should redo multiple row creations', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        expect(countRows()).toEqual(2);

        await alter('insert_row_above');
        await alter('insert_row_above');
        await alter('insert_row_above');
        await alter('insert_row_above');

        expect(countRows()).toEqual(6);

        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(2);

        getPlugin('undoRedo').redo();
        expect(countRows()).toEqual(3);

        getPlugin('undoRedo').redo();
        expect(countRows()).toEqual(4);

        getPlugin('undoRedo').redo();
        expect(countRows()).toEqual(5);

        getPlugin('undoRedo').redo();
        expect(countRows()).toEqual(6);

        getPlugin('undoRedo').redo();
        expect(countRows()).toEqual(6);
      });

      it('should undo multiple row removals', async() => {
        handsontable({
          data: createSpreadsheetData(4, 2)
        });

        expect(countRows()).toEqual(4);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');
        expect(getDataAtCell(3, 0)).toEqual('A4');
        expect(getDataAtCell(3, 1)).toEqual('B4');

        await alter('remove_row');
        await alter('remove_row');
        await alter('remove_row');

        expect(countRows()).toEqual(1);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');

        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(4);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');
        expect(getDataAtCell(3, 0)).toEqual('A4');
        expect(getDataAtCell(3, 1)).toEqual('B4');

        getPlugin('undoRedo').redo();
        expect(countRows()).toEqual(3);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');
        expect(getDataAtCell(2, 0)).toEqual('A3');
        expect(getDataAtCell(2, 1)).toEqual('B3');

        getPlugin('undoRedo').redo();
        expect(countRows()).toEqual(2);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
        expect(getDataAtCell(1, 0)).toEqual('A2');
        expect(getDataAtCell(1, 1)).toEqual('B2');

        getPlugin('undoRedo').redo();
        expect(countRows()).toEqual(1);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');

        getPlugin('undoRedo').redo();
        expect(countRows()).toEqual(1);
        expect(getDataAtCell(0, 0)).toEqual('A1');
        expect(getDataAtCell(0, 1)).toEqual('B1');
      });

      it('should redo changes only for table where the change actually took place', async() => {
        spec().$container2 = $(`<div id="${id}-2"></div>`).appendTo('body');

        const hot1 = handsontable({
          data: [
            [1],
            [2],
            [3]
          ]
        });

        spec().$container2.handsontable({
          data: [
            ['A'],
            ['B'],
            ['C']
          ]
        });

        const hot2 = spec().$container2.handsontable('getInstance');

        hot1.setDataAtCell(0, 0, 4);
        expect(hot1.getDataAtCell(0, 0)).toEqual(4);
        expect(hot2.getDataAtCell(0, 0)).toEqual('A');

        hot1.getPlugin('undoRedo').undo();
        expect(hot1.getDataAtCell(0, 0)).toEqual(1);
        expect(hot2.getDataAtCell(0, 0)).toEqual('A');

        hot2.redo();
        expect(hot1.getDataAtCell(0, 0)).toEqual(1);
        expect(hot2.getDataAtCell(0, 0)).toEqual('A');

        hot1.redo();
        expect(hot1.getDataAtCell(0, 0)).toEqual(4);
        expect(hot2.getDataAtCell(0, 0)).toEqual('A');

        hot2.destroy();
        spec().$container2.remove();
      });
    });
  });

  describe('Object data', () => {
    function createObjectData() {
      return [
        { name: 'Timothy', surname: 'Dalton' },
        { name: 'Sean', surname: 'Connery' },
        { name: 'Roger', surname: 'Moore' }
      ];
    }

    describe('undo', () => {
      it('should undo single change', async() => {
        handsontable({
          data: createObjectData()
        });

        await setDataAtRowProp(0, 0, 'Pearce');

        expect(getDataAtRowProp(0, 0)).toBe('Pearce');

        getPlugin('undoRedo').undo();
        expect(getDataAtCell(0, 0)).toBe('Timothy');
      });

      it('should undo creation of a single row', async() => {
        handsontable({
          data: createObjectData().slice(0, 2)
        });

        expect(countRows()).toEqual(2);

        await alter('insert_row_above');

        expect(countRows()).toEqual(3);

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(2);
      });

      it('should undo creation of multiple rows', async() => {
        handsontable({
          data: createObjectData().slice(0, 2)
        });

        expect(countRows()).toEqual(2);

        await alter('insert_row_above', 0, 5);

        expect(countRows()).toEqual(7);

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(2);
      });

      it('should undo removal of single row', async() => {
        handsontable({
          data: createObjectData().slice(0, 2)
        });

        expect(countRows()).toEqual(2);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');

        await alter('remove_row');

        expect(countRows()).toEqual(1);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toBeNull();
        expect(getDataAtRowProp(1, 'surname')).toBeNull();

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(2);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
      });

      it('should undo removal of multiple rows', async() => {
        handsontable({
          data: createObjectData()
        });

        expect(countRows()).toEqual(3);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
        expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
        expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');

        await alter('remove_row', 1, 2);

        expect(countRows()).toEqual(1);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toBeNull();
        expect(getDataAtRowProp(1, 'surname')).toBeNull();
        expect(getDataAtRowProp(2, 'name')).toBeNull();
        expect(getDataAtRowProp(2, 'surname')).toBeNull();

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(3);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
        expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
        expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');
      });

      it('should undo removal of fixed row on the bottom', async() => {
        handsontable({
          data: createSpreadsheetData(3, 3),
          columns: [
            {}, {}, {}
          ],
          colHeaders: true,
          rowHeaders: true,
          fixedRowsBottom: 1,
          width: 500,
          height: 400,
        });

        await alter('remove_row', 0, 3);
        getPlugin('undoRedo').undo();

        expect(getSettings().fixedRowsBottom).toBe(1);
        // Extra border has stayed after row removal in very specific case (`columns` defined, the Formula plugin enabled) #7146
        expect($('.innerBorderBottom').length).toBe(0);
        expect($('.innerBorderTop').length).toBe(0);
      });

      it('should undo removal of fixed row on the top', async() => {
        handsontable({
          data: createSpreadsheetData(3, 3),
          colHeaders: true,
          rowHeaders: true,
          fixedRowsTop: 1,
        });

        await alter('remove_row', 0, 3);
        getPlugin('undoRedo').undo();

        expect(getSettings().fixedRowsTop).toBe(1);
      });

      it('should undo multiple changes', async() => {
        handsontable({
          data: createObjectData().slice(0, 2)
        });

        await setDataAtRowProp(0, 'name', 'Pierce');
        await setDataAtRowProp(0, 'surname', 'Brosnan');
        await setDataAtRowProp(1, 'name', 'Daniel');
        await setDataAtRowProp(1, 'surname', 'Craig');

        expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
        expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
        expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
        expect(getDataAtRowProp(1, 'surname')).toBe('Craig');

        getPlugin('undoRedo').undo();

        expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
        expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
        expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
        expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

        getPlugin('undoRedo').undo();

        expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
        expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
        expect(getDataAtRowProp(1, 'name')).toBe('Sean');
        expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

        getPlugin('undoRedo').undo();

        expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
        expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
        expect(getDataAtRowProp(1, 'name')).toBe('Sean');
        expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

        getPlugin('undoRedo').undo();

        expect(getDataAtRowProp(0, 'name')).toBe('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
        expect(getDataAtRowProp(1, 'name')).toBe('Sean');
        expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

        getPlugin('undoRedo').undo();

        expect(getDataAtRowProp(0, 'name')).toBe('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
        expect(getDataAtRowProp(1, 'name')).toBe('Sean');
        expect(getDataAtRowProp(1, 'surname')).toBe('Connery');
      });

      it('should undo multiple row creations', async() => {
        handsontable({
          data: createObjectData().slice(0, 2)
        });

        expect(countRows()).toEqual(2);

        await alter('insert_row_above');
        await alter('insert_row_above');
        await alter('insert_row_above');
        await alter('insert_row_above');

        expect(countRows()).toEqual(6);

        getPlugin('undoRedo').undo();
        expect(countRows()).toEqual(5);

        getPlugin('undoRedo').undo();
        expect(countRows()).toEqual(4);

        getPlugin('undoRedo').undo();
        expect(countRows()).toEqual(3);

        getPlugin('undoRedo').undo();
        expect(countRows()).toEqual(2);

        getPlugin('undoRedo').undo();
        expect(countRows()).toEqual(2);
      });

      it('should undo multiple row removals', async() => {
        handsontable({
          data: createObjectData()
        });

        expect(countRows()).toEqual(3);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
        expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
        expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');

        await alter('remove_row');
        await alter('remove_row');

        expect(countRows()).toEqual(1);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(2);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(3);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
        expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
        expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(3);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
        expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
        expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');
      });

      it('should undo removal row with readonly column', async() => {
        handsontable({
          data: createObjectData().slice(0, 2),
          cells(row, col) {
            if (col === 1) {
              return { readOnly: true };
            }

            return {};
          }
        });

        expect(countRows()).toEqual(2);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');

        await alter('remove_row');

        expect(countRows()).toEqual(1);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toBeNull();
        expect(getDataAtRowProp(1, 'surname')).toBeNull();

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(2);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
      });
    });

    describe('redo', () => {
      it('should redo single change', async() => {
        handsontable({
          data: createObjectData()
        });

        await setDataAtRowProp(0, 0, 'Pearce');

        expect(getDataAtRowProp(0, 0)).toBe('Pearce');

        getPlugin('undoRedo').undo();

        expect(getDataAtCell(0, 0)).toBe('Timothy');

        getPlugin('undoRedo').redo();

        expect(getDataAtRowProp(0, 0)).toBe('Pearce');
      });

      it('should redo creation of a single row', async() => {
        handsontable({
          data: createObjectData().slice(0, 2)
        });

        expect(countRows()).toEqual(2);

        await alter('insert_row_above');

        expect(countRows()).toEqual(3);

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(2);

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(3);
      });

      it('should redo creation of multiple rows', async() => {
        handsontable({
          data: createObjectData().slice(0, 2)
        });

        expect(countRows()).toEqual(2);

        await alter('insert_row_above', 0, 5);

        expect(countRows()).toEqual(7);

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(2);

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(7);
      });

      it('should redo removal of single row', async() => {
        handsontable({
          data: createObjectData().slice(0, 2)
        });

        expect(countRows()).toEqual(2);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');

        await alter('remove_row');

        expect(countRows()).toEqual(1);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toBeNull();
        expect(getDataAtRowProp(1, 'surname')).toBeNull();

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(2);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(1);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toBeNull();
        expect(getDataAtRowProp(1, 'surname')).toBeNull();
      });

      it('should redo removal of multiple rows', async() => {
        handsontable({
          data: createObjectData()
        });

        expect(countRows()).toEqual(3);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
        expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
        expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');

        await alter('remove_row', 1, 2);

        expect(countRows()).toEqual(1);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toBeNull();
        expect(getDataAtRowProp(1, 'surname')).toBeNull();
        expect(getDataAtRowProp(2, 'name')).toBeNull();
        expect(getDataAtRowProp(2, 'surname')).toBeNull();

        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(3);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
        expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
        expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(1);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toBeNull();
        expect(getDataAtRowProp(1, 'surname')).toBeNull();
        expect(getDataAtRowProp(2, 'name')).toBeNull();
        expect(getDataAtRowProp(2, 'surname')).toBeNull();
      });

      it('should redo multiple changes', async() => {
        handsontable({
          data: createObjectData().slice(0, 2)
        });

        await setDataAtRowProp(0, 'name', 'Pierce');
        await setDataAtRowProp(0, 'surname', 'Brosnan');
        await setDataAtRowProp(1, 'name', 'Daniel');
        await setDataAtRowProp(1, 'surname', 'Craig');

        expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
        expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
        expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
        expect(getDataAtRowProp(1, 'surname')).toBe('Craig');

        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();

        expect(getDataAtRowProp(0, 'name')).toBe('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
        expect(getDataAtRowProp(1, 'name')).toBe('Sean');
        expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

        getPlugin('undoRedo').redo();

        expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
        expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
        expect(getDataAtRowProp(1, 'name')).toBe('Sean');
        expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

        getPlugin('undoRedo').redo();

        expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
        expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
        expect(getDataAtRowProp(1, 'name')).toBe('Sean');
        expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

        getPlugin('undoRedo').redo();

        expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
        expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
        expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
        expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

        getPlugin('undoRedo').redo();

        expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
        expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
        expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
        expect(getDataAtRowProp(1, 'surname')).toBe('Craig');

        getPlugin('undoRedo').redo();

        expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
        expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
        expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
        expect(getDataAtRowProp(1, 'surname')).toBe('Craig');
      });

      it('should redo multiple row creations', async() => {
        handsontable({
          data: createObjectData().slice(0, 2)
        });

        expect(countRows()).toEqual(2);

        await alter('insert_row_above');
        await alter('insert_row_above');
        await alter('insert_row_above');
        await alter('insert_row_above');

        expect(countRows()).toEqual(6);

        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(2);

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(3);

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(4);

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(5);

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(6);

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(6);
      });

      it('should undo multiple row removals', async() => {
        handsontable({
          data: createObjectData()
        });

        expect(countRows()).toEqual(3);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
        expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
        expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');

        await alter('remove_row');
        await alter('remove_row');

        expect(countRows()).toEqual(1);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');

        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();

        expect(countRows()).toEqual(3);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
        expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
        expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(2);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
        expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(1);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');

        getPlugin('undoRedo').redo();

        expect(countRows()).toEqual(1);
        expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
        expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
      });
    });
  });

  it('should save the undo action only if a new value is different than the previous one', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2)
    });

    expect(getDataAtCell(0, 0)).toBe('A1');
    await setDataAtCell(0, 0, 'A1');

    expect(getPlugin('undoRedo').isUndoAvailable()).toBe(false);

    await setDataAtCell(0, 0, 'A');
    expect(getPlugin('undoRedo').isUndoAvailable()).toBe(true);
  });

  it('should not save the undo action if old and new values are not string, number or boolean', async() => {
    handsontable({
      data: [
        [{ key1: 'abc' }]
      ]
    });

    expect(getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    expect(getDataAtCell(0, 0)).toEqual({ key1: 'abc' });
    await setDataAtCell(0, 0, { key1: 'abc' });

    expect(getPlugin('undoRedo').isUndoAvailable()).toBe(true);
  });
});
