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

  describe('plugin features', () => {
    describe('cell alignment', () => {
      it('should undo a sequence of aligning cells', () => {
        handsontable({
          data: createSpreadsheetData(9, 9),
          contextMenu: true,
          colWidths: [50, 50, 50, 50, 50, 50, 50, 50, 50],
          rowHeights: [50, 50, 50, 50, 50, 50, 50, 50, 50]
        });

        // top 3 rows center
        selectCell(0, 0, 2, 8);
        getPlugin('contextMenu').executeCommand('alignment:center');

        // middle 3 rows unchanged - left

        // bottom 3 rows right
        selectCell(6, 0, 8, 8);
        getPlugin('contextMenu').executeCommand('alignment:right');

        // left 3 columns - middle
        selectCell(0, 0, 8, 2);
        getPlugin('contextMenu').executeCommand('alignment:middle');

        // middle 3 columns unchanged - top

        // right 3 columns - bottom
        selectCell(0, 6, 8, 8);
        getPlugin('contextMenu').executeCommand('alignment:bottom');

        let cellMeta = getCellMeta(0, 0);

        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

        cellMeta = getCellMeta(0, 7);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

        cellMeta = getCellMeta(5, 1);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

        cellMeta = getCellMeta(5, 7);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

        cellMeta = getCellMeta(7, 1);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

        cellMeta = getCellMeta(7, 5);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);

        cellMeta = getCellMeta(7, 7);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

        getPlugin('undoRedo').undo();
        cellMeta = getCellMeta(0, 7);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htBottom')).toEqual(-1);

        cellMeta = getCellMeta(5, 7);
        expect(cellMeta.className.indexOf('htBottom')).toEqual(-1);

        cellMeta = getCellMeta(7, 7);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htBottom')).toEqual(-1);

        getPlugin('undoRedo').undo();

        cellMeta = getCellMeta(0, 0);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htMiddle')).toEqual(-1);

        cellMeta = getCellMeta(5, 1);
        expect(cellMeta.className.indexOf('htMiddle')).toEqual(-1);

        cellMeta = getCellMeta(7, 1);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htMiddle')).toEqual(-1);

        getPlugin('undoRedo').undo();

        cellMeta = getCellMeta(7, 1);
        expect(cellMeta.className.indexOf('htRight')).toEqual(-1);
        expect(cellMeta.className.indexOf('htMiddle')).toEqual(-1);

        cellMeta = getCellMeta(7, 5);
        expect(cellMeta.className.indexOf('htRight')).toEqual(-1);

        cellMeta = getCellMeta(7, 7);
        expect(cellMeta.className.indexOf('htRight')).toEqual(-1);
        expect(cellMeta.className.indexOf('htBottom')).toEqual(-1);

        getPlugin('undoRedo').undo();

        // check if all cells are either non-adjusted or adjusted to the left (as default)
        let finish;

        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            cellMeta = getCellMeta(i, j);
            finish = cellMeta.className === undefined || cellMeta.className.trim() === '' ||
              cellMeta.className.trim() === 'htLeft';

            expect(finish).toBe(true);
          }
        }
      });

      it('should undo/redo row removal with cell meta', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          cells(row, column) {
            const cellProperties = { readOnly: false };

            if (row % 2 === 0 && column % 2 === 0) {
              cellProperties.readOnly = true;
            }

            return cellProperties;
          },
        });

        alter('remove_row', 0, 1);
        alter('remove_row', 0, 2);
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();

        expect(getCellMeta(0, 0).readOnly).toBe(true);
        expect(getCellMeta(0, 1).readOnly).toBe(false);
        expect(getCellMeta(0, 2).readOnly).toBe(true);
        expect(getCellMeta(0, 3).readOnly).toBe(false);
        expect(getCellMeta(0, 4).readOnly).toBe(true);

        expect(getCellMeta(1, 0).readOnly).toBe(false);
        expect(getCellMeta(1, 1).readOnly).toBe(false);
        expect(getCellMeta(1, 2).readOnly).toBe(false);
        expect(getCellMeta(1, 3).readOnly).toBe(false);
        expect(getCellMeta(1, 4).readOnly).toBe(false);

        expect(getCellMeta(2, 0).readOnly).toBe(true);
        expect(getCellMeta(2, 1).readOnly).toBe(false);
        expect(getCellMeta(2, 2).readOnly).toBe(true);
        expect(getCellMeta(2, 3).readOnly).toBe(false);
        expect(getCellMeta(2, 4).readOnly).toBe(true);

        getPlugin('undoRedo').redo();
        getPlugin('undoRedo').redo();
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();

        expect(getCellMeta(0, 0).readOnly).toBe(true);
        expect(getCellMeta(0, 1).readOnly).toBe(false);
        expect(getCellMeta(0, 2).readOnly).toBe(true);
        expect(getCellMeta(0, 3).readOnly).toBe(false);
        expect(getCellMeta(0, 4).readOnly).toBe(true);

        expect(getCellMeta(1, 0).readOnly).toBe(false);
        expect(getCellMeta(1, 1).readOnly).toBe(false);
        expect(getCellMeta(1, 2).readOnly).toBe(false);
        expect(getCellMeta(1, 3).readOnly).toBe(false);
        expect(getCellMeta(1, 4).readOnly).toBe(false);

        expect(getCellMeta(2, 0).readOnly).toBe(true);
        expect(getCellMeta(2, 1).readOnly).toBe(false);
        expect(getCellMeta(2, 2).readOnly).toBe(true);
        expect(getCellMeta(2, 3).readOnly).toBe(false);
        expect(getCellMeta(2, 4).readOnly).toBe(true);
      });

      it('should undo/redo column removal with cell meta', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          cells(row, column) {
            const cellProperties = { readOnly: false };

            if (row % 2 === 0 && column % 2 === 0) {
              cellProperties.readOnly = true;
            }

            return cellProperties;
          },
        });

        alter('remove_col', 0, 1);
        alter('remove_col', 0, 2);
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();

        expect(getCellMeta(0, 0).readOnly).toBe(true);
        expect(getCellMeta(0, 1).readOnly).toBe(false);
        expect(getCellMeta(0, 2).readOnly).toBe(true);
        expect(getCellMeta(0, 3).readOnly).toBe(false);
        expect(getCellMeta(0, 4).readOnly).toBe(true);

        expect(getCellMeta(1, 0).readOnly).toBe(false);
        expect(getCellMeta(1, 1).readOnly).toBe(false);
        expect(getCellMeta(1, 2).readOnly).toBe(false);
        expect(getCellMeta(1, 3).readOnly).toBe(false);
        expect(getCellMeta(1, 4).readOnly).toBe(false);

        expect(getCellMeta(2, 0).readOnly).toBe(true);
        expect(getCellMeta(2, 1).readOnly).toBe(false);
        expect(getCellMeta(2, 2).readOnly).toBe(true);
        expect(getCellMeta(2, 3).readOnly).toBe(false);
        expect(getCellMeta(2, 4).readOnly).toBe(true);

        getPlugin('undoRedo').redo();
        getPlugin('undoRedo').redo();
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();

        expect(getCellMeta(0, 0).readOnly).toBe(true);
        expect(getCellMeta(0, 1).readOnly).toBe(false);
        expect(getCellMeta(0, 2).readOnly).toBe(true);
        expect(getCellMeta(0, 3).readOnly).toBe(false);
        expect(getCellMeta(0, 4).readOnly).toBe(true);

        expect(getCellMeta(1, 0).readOnly).toBe(false);
        expect(getCellMeta(1, 1).readOnly).toBe(false);
        expect(getCellMeta(1, 2).readOnly).toBe(false);
        expect(getCellMeta(1, 3).readOnly).toBe(false);
        expect(getCellMeta(1, 4).readOnly).toBe(false);

        expect(getCellMeta(2, 0).readOnly).toBe(true);
        expect(getCellMeta(2, 1).readOnly).toBe(false);
        expect(getCellMeta(2, 2).readOnly).toBe(true);
        expect(getCellMeta(2, 3).readOnly).toBe(false);
        expect(getCellMeta(2, 4).readOnly).toBe(true);
      });

      it('should not throw an error after undoing the row header aligning', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
        });

        selectRows(1);
        getPlugin('contextMenu').executeCommand('alignment:center');

        expect(() => {
          getPlugin('undoRedo').undo();
        }).not.toThrowError();
      });

      it('should not throw an error after undoing the column header aligning', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
        });

        selectColumns(1);
        getPlugin('contextMenu').executeCommand('alignment:right');

        expect(() => {
          getPlugin('undoRedo').undo();
        }).not.toThrowError();
      });

      it('should redo a sequence of aligning cells', () => {
        handsontable({
          data: createSpreadsheetData(9, 9),
          contextMenu: true,
          colWidths: [50, 50, 50, 50, 50, 50, 50, 50, 50],
          rowHeights: [50, 50, 50, 50, 50, 50, 50, 50, 50]
        });

        // top 3 rows center
        selectCell(0, 0, 2, 8);
        getPlugin('contextMenu').executeCommand('alignment:center');

        // middle 3 rows unchanged - left

        // bottom 3 rows right
        selectCell(6, 0, 8, 8);
        getPlugin('contextMenu').executeCommand('alignment:right');

        // left 3 columns - middle
        selectCell(0, 0, 8, 2);
        getPlugin('contextMenu').executeCommand('alignment:middle');

        // middle 3 columns unchanged - top

        // right 3 columns - bottom
        selectCell(0, 6, 8, 8);
        getPlugin('contextMenu').executeCommand('alignment:bottom');

        let cellMeta = getCellMeta(0, 0);

        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

        cellMeta = getCellMeta(0, 7);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

        cellMeta = getCellMeta(5, 1);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

        cellMeta = getCellMeta(5, 7);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

        cellMeta = getCellMeta(7, 1);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

        cellMeta = getCellMeta(7, 5);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);

        cellMeta = getCellMeta(7, 7);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();

        // check if all cells are either non-adjusted or adjusted to the left (as default)
        let finish;

        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            cellMeta = getCellMeta(i, j);
            finish = cellMeta.className === undefined || cellMeta.className.trim() === '' ||
              cellMeta.className.trim() === 'htLeft';

            expect(finish).toBe(true);
          }
        }

        getPlugin('undoRedo').redo();
        cellMeta = getCellMeta(0, 0);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        cellMeta = getCellMeta(1, 5);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        cellMeta = getCellMeta(2, 8);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);

        getPlugin('undoRedo').redo();
        cellMeta = getCellMeta(6, 0);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        cellMeta = getCellMeta(7, 5);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        cellMeta = getCellMeta(8, 8);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);

        getPlugin('undoRedo').redo();
        cellMeta = getCellMeta(0, 0);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        cellMeta = getCellMeta(5, 1);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);
        cellMeta = getCellMeta(8, 2);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);

        getPlugin('undoRedo').redo();
        cellMeta = getCellMeta(0, 6);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        cellMeta = getCellMeta(5, 7);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);
        cellMeta = getCellMeta(8, 8);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
      });

      it('should not throw an error after redoing the row header aligning', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
        });

        selectRows(1);
        getPlugin('contextMenu').executeCommand('alignment:center');
        getPlugin('undoRedo').undo();

        expect(() => {
          getPlugin('undoRedo').redo();
        }).not.toThrowError();
      });

      it('should not throw an error after redoing the column header aligning', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
        });

        selectColumns(1);
        getPlugin('contextMenu').executeCommand('alignment:right');
        getPlugin('undoRedo').undo();

        expect(() => {
          getPlugin('undoRedo').redo();
        }).not.toThrowError();
      });
    });

    describe('merge cells', () => {
      it('should not throw an error after undoing cell merging triggered when the row header was selected', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
          mergeCells: true,
        });

        selectRows(1);
        getPlugin('contextMenu').executeCommand('mergeCells');

        expect(() => {
          getPlugin('undoRedo').undo();
        }).not.toThrowError();
      });

      it('should not throw an error after undoing cell merging triggered when the column header was selected', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
          mergeCells: true,
        });

        selectColumns(1);
        getPlugin('contextMenu').executeCommand('mergeCells');

        expect(() => {
          getPlugin('undoRedo').undo();
        }).not.toThrowError();
      });

      it('should not throw an error after redoing cell merging triggered when the row header was selected', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
          mergeCells: true,
        });

        selectRows(1);
        getPlugin('contextMenu').executeCommand('mergeCells');
        getPlugin('undoRedo').undo();

        expect(() => {
          getPlugin('undoRedo').redo();
        }).not.toThrowError();
      });

      it('should not throw an error after redoing cell merging triggered when the column header was selected', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
          mergeCells: true,
        });

        selectColumns(1);
        getPlugin('contextMenu').executeCommand('mergeCells');
        getPlugin('undoRedo').undo();

        expect(() => {
          getPlugin('undoRedo').redo();
        }).not.toThrowError();
      });
    });

    it('should exposed new methods when plugin is enabled', () => {
      const hot = handsontable({
        undo: false
      });

      expect(hot.undo).toBeUndefined();
      expect(hot.redo).toBeUndefined();
      expect(hot.isUndoAvailable).toBeUndefined();
      expect(hot.isRedoAvailable).toBeUndefined();
      expect(hot.clearUndo).toBeUndefined();

      updateSettings({
        undo: true
      });

      expect(typeof hot.undo).toEqual('function');
      expect(typeof hot.redo).toEqual('function');
      expect(typeof hot.isUndoAvailable).toEqual('function');
      expect(typeof hot.isRedoAvailable).toEqual('function');
      expect(typeof hot.clearUndo).toEqual('function');
    });

    it('should remove exposed methods when plugin is disbaled', () => {
      const hot = handsontable({
        undo: true
      });

      expect(typeof hot.undo).toEqual('function');
      expect(typeof hot.redo).toEqual('function');
      expect(typeof hot.isUndoAvailable).toEqual('function');
      expect(typeof hot.isRedoAvailable).toEqual('function');
      expect(typeof hot.clearUndo).toEqual('function');

      updateSettings({
        undo: false
      });

      expect(hot.undo).toBeUndefined();
      expect(hot.redo).toBeUndefined();
      expect(hot.isUndoAvailable).toBeUndefined();
      expect(hot.isRedoAvailable).toBeUndefined();
      expect(hot.clearUndo).toBeUndefined();
    });

    describe('Keyboard shortcuts', () => {
      it('should undo single change after hitting CTRL+Z', () => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        selectCell(0, 0);
        setDataAtCell(0, 0, 'new value');

        keyDownUp(['control/meta', 'z']);
        expect(getDataAtCell(0, 0)).toBe('A1');
      });

      it('should redo single change after hitting CTRL+Y', () => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        selectCell(0, 0);
        setDataAtCell(0, 0, 'new value');

        expect(getDataAtCell(0, 0)).toBe('new value');

        getPlugin('undoRedo').undo();
        expect(getDataAtCell(0, 0)).toBe('A1');

        keyDownUp(['control/meta', 'y']);

        expect(getDataAtCell(0, 0)).toBe('new value');
      });

      it('should redo single change after hitting CTRL+SHIFT+Z', () => {
        handsontable({
          data: createSpreadsheetData(2, 2)
        });

        selectCell(0, 0);
        setDataAtCell(0, 0, 'new value');

        expect(getDataAtCell(0, 0)).toBe('new value');

        getPlugin('undoRedo').undo();
        expect(getDataAtCell(0, 0)).toBe('A1');

        keyDownUp(['control/meta', 'shift', 'z']);

        expect(getDataAtCell(0, 0)).toBe('new value');
      });

      it('should be possible to block keyboard shortcuts', () => {
        handsontable({
          data: createSpreadsheetData(2, 2),
          beforeKeyDown: (e) => {
            const ctrlDown = (e.ctrlKey || e.metaKey) && !e.altKey;

            if (ctrlDown && (e.keyCode === 90 || (e.shiftKey && e.keyCode === 90))) {
              Handsontable.dom.stopImmediatePropagation(e);
            }
          }
        });

        selectCell(0, 0);
        setDataAtCell(0, 0, 'new value');

        keyDownUp(['control/meta', 'z']);
        expect(getDataAtCell(0, 0)).toBe('new value');
      });

      it('should not undo changes in the other cells if editor is open', () => {
        handsontable({
          data: createSpreadsheetData(2, 2),
        });

        selectCell(0, 0);
        setDataAtCell(0, 0, 'new value');

        selectCell(1, 0);
        keyDownUp('enter');
        keyDownUp(['control/meta', 'z']);
        expect(getDataAtCell(0, 0)).toBe('new value');
      });
    });
  });
});
