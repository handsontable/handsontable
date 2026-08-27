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
    it('should allow adding and removing rows, while retaining the formulas functionality', async() => {
      handsontable({
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

      expect(getDataAtCell(1, 0)).toEqual('parent1-');
      expect(getDataAtCell(4, 0)).toEqual('PARENT1');

      await alter('insert_row_above', 1, 1);
      await alter('insert_row_above', 3, 1);
      await alter('insert_row_above', 7, 1);

      expect(getDataAtCell(2, 0)).toEqual('parent1-');
      expect(getDataAtCell(6, 0)).toEqual('PARENT1');
    });

    it('should allow detaching row children, while retaining the formulas functionality', async() => {
      handsontable({
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
      const nestedRowsPlugin = getPlugin('nestedRows');
      const nestedRowsDataManager = nestedRowsPlugin.dataManager;

      let rowToBeDetached = nestedRowsDataManager.getDataObject(1);

      nestedRowsDataManager.detachFromParent(rowToBeDetached);

      expect(getDataAtCell(2, 0)).toEqual('parent1-');
      expect(getDataAtCell(5, 0)).toEqual('PARENT1');

      rowToBeDetached = nestedRowsDataManager.getDataObject(5);

      nestedRowsDataManager.detachFromParent(rowToBeDetached);

      expect(getDataAtCell(6, 0)).toEqual('PARENT1');
    });

    it('should allow collapsing/expanding while retaining the formulas functionality', async() => {
      handsontable({
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

      const plugin = getPlugin('nestedRows');

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

    it('should allow moving while retaining the formulas functionality', async() => {
      handsontable({
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

      getPlugin('manualRowMove').dragRows([4], 7);

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

      getPlugin('manualRowMove').dragRows([7], 1);

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

    it('should keep the formula sync working when the detach throws while reading the source data', async() => {
      const shouldThrow = { current: false };

      handsontable({
        data: [
          {
            col1: { label: 'parent1' },
            __children: [
              { col1: { label: 'child1' } },
            ],
          },
          { col1: '=A1 & "!"' },
        ],
        columns: [{
          data: 'col1',
          type: 'text',
          // Reached from `#getValueGetterValue`, which runs for object-valued cells only. The
          // detach listener calls it while its `#internalOperationPending` guard is up - that is
          // the one window in which a throw can leave the guard set, so it is the one the
          // `finally` has to cover.
          valueGetter(value) {
            if (shouldThrow.current) {
              throw new Error('valueGetter failed');
            }

            return (value && typeof value === 'object') ? value.label : value;
          },
        }],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        nestedRows: true,
      });

      expect(getDataAtCell(2, 0)).toEqual('parent1!');

      shouldThrow.current = true;

      expect(() => {
        getPlugin('nestedRows').dataManager.detachFromParent(
          getPlugin('nestedRows').dataManager.getDataObject(1)
        );
      }).toThrow();

      shouldThrow.current = false;

      // With the guard stuck up, `#onModifyData` early-returns for every cell, so the formula cell
      // reports its own raw text instead of the engine's value.
      expect(getDataAtCol(0)).not.toContain('=A1 & "!"');
      expect(getDataAtCol(0)).toContain('parent1!');
    });

    it('should clear the detach guard when the plugin is re-enabled', async() => {
      const data = [
        [10, '=SUM(A1:A3)'],
        [20, null],
        [30, null],
      ];

      handsontable({
        data,
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
      });

      // The Nested Rows plugin opens the guard span in `beforeDetachChild`. This plugin's
      // `afterDetachChild` listener - the one that closes it - is not the first on that hook, so a
      // throw from the Nested Rows plugin's own listener leaves the span open with nobody to close
      // it. Running the opening hook on its own reproduces exactly that state.
      await runHooks('beforeDetachChild');
      await alter('insert_row_above', 1, 1);

      // The guard is up, so the engine's rewritten formula never reaches the developer's array.
      expect(data[0][1]).toBe('=SUM(A1:A3)');

      getPlugin('formulas').disablePlugin();
      getPlugin('formulas').enablePlugin();

      await alter('insert_row_above', 1, 1);

      // `enablePlugin()` clears the guard, so the write-back works again.
      expect(data[0][1]).toBe('=SUM(A1:A4)');
    });
  });
});
