import HyperFormula from 'hyperformula';

describe('Formulas', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
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

    it('should allow collapsing/expanding while retaining the formulas functionality', () => {
      const hot = handsontable({
        data: [{
          col1: 1,
          __children: [{
            col1: '=A1+10',
            __children: [{
              col1: '=A2+100',
            }, {
              col1: '=A3+1000',
              __children: [{
                col1: '=A4+1000000',
              }, {
                col1: '=A5+2000000',
              }, {
                col1: '=A6+3000000',
              }]
            }, {
              col1: '=A1*0',
            }]
          }],
        }, {
          col1: '=A7 & "+"',
        }],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        nestedRows: true,
        rowHeaders: true,
        colHeaders: true
      });

      const plugin = hot.getPlugin('nestedRows');

      plugin.collapsingUI.collapseAll();

      expect(getData()).toEqual([
        [1],
        ['6001111+'],
      ]);

      plugin.collapsingUI.expandAll();

      expect(getData()).toEqual([
        [1],
        [11],
        [111],
        [1111],
        [1001111],
        [3001111],
        [6001111],
        [0],
        ['6001111+'],
      ]);
    });

    it('should allow moving while retaining the formulas functionality', () => {
      const hot = handsontable({
        data: [{
          col1: 1,
          __children: [{
            col1: '=A1+10',
            __children: [{
              col1: '=A2+100',
            }, {
              col1: '=A3+1000',
              __children: [{
                col1: '=A4+1000000',
              }, {
                col1: '=A5+2000000',
              }, {
                col1: '=A6+3000000',
              }]
            }, {
              col1: '=A1*0',
            }]
          }],
        }, {
          col1: '=A7 & "+"',
        }],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        nestedRows: true,
        rowHeaders: true,
        colHeaders: true
      });

      hot.getPlugin('manualRowMove').dragRows([4], 7);

      expect(getData()).toEqual([
        [1],
        [11],
        [111],
        [1111],
        [3001111],
        [6001111],
        [1001111],
        [0],
        ['6001111+'],
      ]);

      hot.getPlugin('manualRowMove').dragRows([7], 1);

      expect(getData()).toEqual([
        [1],
        [0],
        [11],
        [111],
        [1111],
        [3001111],
        [6001111],
        [1001111],
        ['6001111+'],
      ]);
    });
  });
});
