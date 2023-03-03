import HyperFormula from 'hyperformula';

describe('Formulas: Integration with other features', () => {
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

  describe('Integration with alter', () => {
    it('should allow inserting rows and columns with the formula plugin enabled', () => {
      const hot = handsontable({
        data: [['foo', null], ['=A1', null]],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
      });

      alter('insert_row_above', 0, 1);
      alter('insert_row_above', 2, 1);
      alter('insert_row_above', hot.countRows(), 1);

      expect(hot.countRows()).toEqual(5);

      alter('insert_col_start', 0, 1);
      alter('insert_col_start', 2, 1);
      alter('insert_col_start', hot.countCols(), 1);

      expect(hot.countCols()).toEqual(5);
    });

    it('should work properly when indexes are reorganised and some rows/columns are inserted', () => {
      handsontable({
        data: [
          [1, '=A1+10', '=B1+100', '=C1+1000', '=D1+1000000'],
          [2, '=A2+10', '=B2+100', '=C2+1000', '=D2+1000000'],
          [3, '=A3+10', '=B3+100', '=C3+1000', '=D3+1000000'],
          [4, '=A4+10', '=B4+100', '=C4+1000', '=D4+1000000'],
          [5, '=A5+10', '=B5+100', '=C5+1000', '=D5+1000000'],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        manualRowMove: true,
        manualColumnMove: true,
      });

      getPlugin('manualRowMove').moveRows([4, 3, 2, 1, 0], 0);
      getPlugin('manualColumnMove').moveColumns([4, 3, 2, 1, 0], 0);
      render();

      alter('insert_col_start', 0, 1);
      alter('insert_row_above', 0, 1);
      alter('insert_row_below', 1, 1);

      expect(getData()).toEqual([
        [null, null, null, null, null, null],
        [null, 1001115, 1115, 115, 15, 5],
        [null, null, null, null, null, null],
        [null, 1001114, 1114, 114, 14, 4],
        [null, 1001113, 1113, 113, 13, 3],
        [null, 1001112, 1112, 112, 12, 2],
        [null, 1001111, 1111, 111, 11, 1],
      ]);
    });

    it('should work properly when indexes are reorganised and some rows/columns are removed', () => {
      handsontable({
        data: [
          [1, '=A1+10', '=B1+100', '=C1+1000', '=D1+1000000'],
          [2, '=A2+10', '=B2+100', '=C2+1000', '=D2+1000000'],
          [3, '=A3+10', '=B3+100', '=C3+1000', '=D3+1000000'],
          [4, '=A4+10', '=B4+100', '=C4+1000', '=D4+1000000'],
          [5, '=A5+10', '=B5+100', '=C5+1000', '=D5+1000000'],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        manualRowMove: true,
        manualColumnMove: true,
      });

      getPlugin('manualRowMove').moveRows([4, 3, 2, 1, 0], 0);
      getPlugin('manualColumnMove').moveColumns([4, 3, 2, 1, 0], 0);
      render();

      alter('remove_row', 2, 2);
      alter('remove_row', 2, 1);
      render();

      expect(getData()).toEqual([
        [1001115, 1115, 115, 15, 5],
        [1001114, 1114, 114, 14, 4],
      ]);
    });
  });

  describe('Integration with Copy/Paste', () => {
    it('should allow pasting data near the table borders (thus extending the table)', () => {
      const hot = handsontable({
        data: [[1, 'x'], ['=A1 + 1', 'y']],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
      });

      const copyEvent = getClipboardEvent();
      const copyPastePlugin = getPlugin('CopyPaste');

      selectCell(0, 0, 1, 1);

      copyPastePlugin.onCopy(copyEvent);

      selectCell(1, 1);

      copyPastePlugin.onPaste(copyEvent);

      expect(hot.countRows()).toEqual(3);
      expect(hot.countCols()).toEqual(3);
      expect(hot.getData()).toEqual([
        [1, 'x', null],
        [2, '1', 'x'],
        [null, '2', 'y']
      ]);
    });
  });

  describe('Integration with minSpareRows/minSpareCols', () => {
    it('should display the minSpareRows and minSpareCols properly', () => {
      const hot = handsontable({
        data: [[1, 'x'], ['=A1 + 1', 'y']],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        minSpareRows: 3,
        minSpareCols: 3,
      });

      expect(hot.countRows()).toEqual(5);
      expect(hot.countCols()).toEqual(5);
      expect(hot.getData()).toEqual([
        [1, 'x', null, null, null],
        [2, 'y', null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null]
      ]);
    });
  });

  describe('Integration with Autofill', () => {
    it('should allow dragging the fill handle outside of the table, adding new rows and performing autofill', async() => {
      const hot = handsontable({
        data: [
          ['test', 2, '=UPPER($A$1)', 4, 5, 6],
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6]
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        fillHandle: true
      });

      selectCell(0, 2);

      spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
      spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

      expect(hot.countRows()).toBe(4);

      await sleep(300);
      expect(hot.countRows()).toBe(5);

      spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

      await sleep(300);
      expect(hot.countRows()).toBe(6);

      spec().$container.find('tr:last-child td:eq(2)').simulate('mouseup');

      await sleep(300);

      expect(hot.getData()).toEqual([
        ['test', 2, 'TEST', 4, 5, 6],
        [1, 2, 'TEST', 4, 5, 6],
        [1, 2, 'TEST', 4, 5, 6],
        [1, 2, 'TEST', 4, 5, 6],
        [null, null, 'TEST', null, null, null],
        [null, null, null, null, null, null]
      ]);

      expect(hot.getSourceData()).toEqual([
        ['test', 2, '=UPPER($A$1)', 4, 5, 6],
        [1, 2, '=UPPER($A$1)', 4, 5, 6],
        [1, 2, '=UPPER($A$1)', 4, 5, 6],
        [1, 2, '=UPPER($A$1)', 4, 5, 6],
        [null, null, '=UPPER($A$1)', null, null, null],
        [null, null, null, null, null, null]
      ]);
    });
  });

  describe('Integration with Nested Rows', () => {
    it('should allow adding and removing rows, while retaining the formulas functionality', () => {
      const hot = handsontable({
        data: [
          {
            col1: 'parent1',
            __children: [
              {
                col1: '=A1 & "-"',
                __children: [
                  {
                    col1: 'p1.c1.c1',
                  }, {
                    col1: 'p1.c1.c2',
                    __children: [
                      {
                        col1: '=UPPER(A1)',
                      }
                    ]
                  }
                ]
              }],
          }],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        nestedRows: true,
        rowHeaders: true,
        colHeaders: true
      });

      expect(hot.getDataAtCell(1, 0)).toEqual('parent1-');
      expect(hot.getDataAtCell(4, 0)).toEqual('PARENT1');

      hot.alter('insert_row_above', 1, 1);
      hot.alter('insert_row_above', 3, 1);
      hot.alter('insert_row_above', 7, 1);

      expect(hot.getDataAtCell(2, 0)).toEqual('parent1-');
      expect(hot.getDataAtCell(6, 0)).toEqual('PARENT1');
    });

    it('should allow detaching row children, while retaining the formulas functionality', () => {
      const hot = handsontable({
        data: [
          {
            col1: 'parent1',
            __children: [
              {
                col1: '=A1 & "-"',
                __children: [
                  {
                    col1: 'p1.c1.c1',
                  }, {
                    col1: 'p1.c1.c2',
                    __children: [
                      {
                        col1: '=UPPER(A1)',
                      }
                    ]
                  },
                  {
                    col1: 'p1.c1.c3',
                  }
                ]
              }],
          },
          {
            col1: 'parent2',
          }],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        nestedRows: true,
        rowHeaders: true,
        colHeaders: true
      });
      const nestedRowsPlugin = hot.getPlugin('nestedRows');
      const nestedRowsDataManager = nestedRowsPlugin.dataManager;

      let rowToBeDetached = nestedRowsDataManager.getDataObject(1);

      nestedRowsDataManager.detachFromParent(rowToBeDetached);

      expect(hot.getDataAtCell(2, 0)).toEqual('parent1-');
      expect(hot.getDataAtCell(5, 0)).toEqual('PARENT1');

      rowToBeDetached = nestedRowsDataManager.getDataObject(5);

      nestedRowsDataManager.detachFromParent(rowToBeDetached);

      expect(hot.getDataAtCell(6, 0)).toEqual('PARENT1');
    });
  });

  describe('Integration with Frozen Columns', () => {
    it('should calculate result of formula properly after freezing/unfreezing column using ManualColumnFreeze plugin API', () => {
      const hot = handsontable({
        data: [
          [1, '=A1+10', '=B1+100', '=C1+1000', '=D1+1000000'],
          [2, '=A2+10', '=B2+100', '=C2+1000', '=D2+1000000'],
          [3, '=A3+10', '=B3+100', '=C3+1000', '=D3+1000000'],
          [4, '=A4+10', '=B4+100', '=C4+1000', '=D4+1000000'],
          [5, '=A5+10', '=B5+100', '=C5+1000', '=D5+1000000'],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        manualColumnFreeze: true,
        manualColumnMove: true,
      });

      hot.getPlugin('manualColumnFreeze').freezeColumn(2);
      hot.render();

      expect(getData()).toEqual([
        [111, 1, 11, 1111, 1001111],
        [112, 2, 12, 1112, 1001112],
        [113, 3, 13, 1113, 1001113],
        [114, 4, 14, 1114, 1001114],
        [115, 5, 15, 1115, 1001115],
      ]);

      hot.getPlugin('manualColumnFreeze').freezeColumn(4);
      hot.render();

      expect(getData()).toEqual([
        [111, 1001111, 1, 11, 1111],
        [112, 1001112, 2, 12, 1112],
        [113, 1001113, 3, 13, 1113],
        [114, 1001114, 4, 14, 1114],
        [115, 1001115, 5, 15, 1115],
      ]);

      hot.getPlugin('manualColumnFreeze').freezeColumn(4);
      hot.render();

      expect(getData()).toEqual([
        [111, 1001111, 1111, 1, 11],
        [112, 1001112, 1112, 2, 12],
        [113, 1001113, 1113, 3, 13],
        [114, 1001114, 1114, 4, 14],
        [115, 1001115, 1115, 5, 15],
      ]);

      hot.getPlugin('manualColumnFreeze').unfreezeColumn(0);
      hot.render();

      expect(getData()).toEqual([
        [1001111, 1111, 111, 1, 11],
        [1001112, 1112, 112, 2, 12],
        [1001113, 1113, 113, 3, 13],
        [1001114, 1114, 114, 4, 14],
        [1001115, 1115, 115, 5, 15],
      ]);

      hot.getPlugin('manualColumnFreeze').unfreezeColumn(0);
      hot.render();

      expect(getData()).toEqual([
        [1111, 1001111, 111, 1, 11],
        [1112, 1001112, 112, 2, 12],
        [1113, 1001113, 113, 3, 13],
        [1114, 1001114, 114, 4, 14],
        [1115, 1001115, 115, 5, 15],
      ]);

      hot.getPlugin('manualColumnFreeze').unfreezeColumn(0);
      hot.render();

      expect(getData()).toEqual([
        [1111, 1001111, 111, 1, 11],
        [1112, 1001112, 112, 2, 12],
        [1113, 1001113, 113, 3, 13],
        [1114, 1001114, 114, 4, 14],
        [1115, 1001115, 115, 5, 15],
      ]);
    });
  });
});
