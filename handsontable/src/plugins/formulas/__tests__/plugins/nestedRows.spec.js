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

    it('should read the valueGetter from the detached rows own meta', async() => {
      handsontable({
        data: [
          {
            col1: { label: 'parent1' },
            __children: [
              { col1: { label: 'child1' } },
            ],
          },
          { col1: { label: 'parent2' } },
        ],
        columns: [{ data: 'col1', type: 'text' }],
        // Stamps the PHYSICAL row the meta was resolved from onto the value, so the engine content
        // shows which row's `valueGetter` each cell actually went through.
        cells(row) {
          return {
            valueGetter(value) {
              return (value && typeof value === 'object') ? `r${row}:${value.label}` : value;
            },
          };
        },
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        nestedRows: true,
      });

      getPlugin('nestedRows').dataManager.detachFromParent(
        getPlugin('nestedRows').dataManager.getDataObject(1)
      );

      const formulasPlugin = getPlugin('formulas');

      // The detach rewrites the rows from the detached element down, so `child1` - now physical
      // row 2 - has to go through row 2's `valueGetter`. Reading the array-relative index as a
      // physical one sends it through row 0's instead. The rows above the detached element are not
      // rewritten, so `parent2` keeps the stamp it got at load time.
      expect(formulasPlugin.engine.getSheetSerialized(formulasPlugin.sheetId)).toEqual([
        ['r0:parent1'],
        ['r2:parent2'],
        ['r2:child1'],
      ]);
    });

    it('should detach a collapsed parent whose children hold object values', async() => {
      handsontable({
        data: [
          {
            col1: { label: 'parent1' },
            __children: [
              {
                col1: { label: 'child1' },
                __children: [
                  { col1: { label: 'grandchild1' } },
                  { col1: { label: 'grandchild2' } },
                ],
              },
            ],
          },
          { col1: { label: 'parent2' } },
        ],
        columns: [{ data: 'col1', type: 'text' }],
        // Stamps the PHYSICAL row the meta resolved from onto the value.
        cells(row) {
          return {
            valueGetter(value) {
              return (value && typeof value === 'object') ? `r${row}:${value.label}` : value;
            },
          };
        },
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        nestedRows: true,
      });

      // Collapsing `child1` installs a TRIMMING map over its grandchildren, so they keep their
      // physical rows and lose their visual ones. Detaching `child1` then rewrites a range that
      // CONTAINS those trimmed rows.
      getPlugin('nestedRows').collapsingUI.collapseChildren(1);

      getPlugin('nestedRows').dataManager.detachFromParent(
        getPlugin('nestedRows').dataManager.getDataObject(1)
      );

      const p = getPlugin('formulas');

      // Every rewritten row resolves its `valueGetter` from its own physical row, the trimmed
      // grandchildren included. `parent2` keeps the stamp it got at load time - the detach rewrites
      // only from the detached element down, so the rows above it are not re-read.
      expect(p.engine.getSheetSerialized(p.sheetId)).toEqual([
        ['r0:parent1'],
        ['r4:parent2'],
        ['r2:child1'],
        ['r3:grandchild1'],
        ['r4:grandchild2'],
      ]);
    });

    it('should clear the detach guard on the next structural operation', async() => {
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

      // Leaves the guard span open with nobody to close it - see the re-enable case below for why
      // `afterDetachChild` can fail to arrive at all.
      await runHooks('beforeDetachChild');
      await alter('insert_row_above', 1, 1);

      expect(data[0][1]).toBe('=SUM(A1:A3)');

      // A grid that is never re-enabled has to recover too, so the guard is bounded by the next
      // structural operation rather than by the next `enablePlugin()`.
      const reloaded = [
        [10, '=SUM(A1:A3)'],
        [20, null],
        [30, null],
      ];

      await loadData(reloaded);
      await alter('insert_row_above', 1, 1);

      // Asserted on the array the grid was handed, not through `getSourceDataAtCell()`:
      // `#onModifySourceData` answers that getter with the formula the ENGINE holds, which is
      // already rewritten whether or not the write-back ran.
      expect(reloaded[0][1]).toBe('=SUM(A1:A4)');
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
