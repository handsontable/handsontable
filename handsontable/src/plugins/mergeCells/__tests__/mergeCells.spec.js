describe('MergeCells', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('initialization', () => {
    it('should merge cell in startup', async() => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ]
      });
      const TD = hot.rootElement.querySelector('td');

      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');
    });

    it('should overwrite proper cells while creating new dataset (with nulls in place of merge areas)', async() => {
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: [
          [null, null, 3, 4, null],
          [null, null, null, null, null],
          [null, 5, null, null, null],
        ],
        mergeCells: [{
          row: 0,
          col: 3,
          rowspan: 2,
          colspan: 2
        }, {
          row: 2,
          col: 1,
          rowspan: 1,
          colspan: 2
        }],
        afterChange,
      });

      expect(afterChange.calls.mostRecent().args[0]).toEqual([
        [0, 4, null, null],
        [1, 3, null, null],
        [1, 4, null, null],
        [2, 2, null, null],
      ]);
      expect(getSourceData()).toEqual([
        [null, null, 3, 4, null],
        [null, null, null, null, null],
        [null, 5, null, null, null],
      ]);
      expect(getData()).toEqual([
        [null, null, 3, 4, null],
        [null, null, null, null, null],
        [null, 5, null, null, null],
      ]);
    });

    it('should provide information about the source of the change in the `beforeChange` and `afterChange` hooks', async() => {
      const beforeChange = jasmine.createSpy('beforeChange');
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
          [13, 14, 15, 16],
        ],
        mergeCells: [{
          row: 0,
          col: 0,
          rowspan: 2,
          colspan: 2
        }],
        beforeChange,
        afterChange,
      });

      expect(beforeChange.calls.mostRecent().args[1]).toEqual('MergeCells');
      expect(afterChange.calls.mostRecent().args[1]).toEqual('MergeCells');

      getPlugin('mergeCells').merge(2, 2, 3, 3);

      expect(beforeChange.calls.mostRecent().args[1]).toEqual('MergeCells');
      expect(afterChange.calls.mostRecent().args[1]).toEqual('MergeCells');
    });

    it('should merge cells on startup respecting indexes sequence changes', async() => {
      handsontable({
        data: [
          ['A1', 'B1', null, null],
          ['A2', 'B2', null, null]
        ],
        mergeCells: [{
          row: 0,
          col: 2,
          rowspan: 1,
          colspan: 2
        }, {
          row: 1,
          col: 2,
          rowspan: 1,
          colspan: 2
        }],
        manualColumnMove: [1, 0, 2, 3],
      });

      expect(getSourceData()).toEqual([['A1', 'B1', null, null], ['A2', 'B2', null, null]]);
      expect(getData()).toEqual([['B1', 'A1', null, null], ['B2', 'A2', null, null]]);
    });
  });

  describe('mergeCells updateSettings', () => {
    it('should allow to overwrite the initial settings using the updateSettings method', async() => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ]
      });
      let TD = hot.rootElement.querySelector('td');

      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');

      await updateSettings({
        mergeCells: [
          { row: 2, col: 2, rowspan: 2, colspan: 2 }
        ]
      });

      TD = hot.rootElement.querySelector('td');
      expect(TD.getAttribute('rowspan')).toBe(null);
      expect(TD.getAttribute('colspan')).toBe(null);

      TD = getCell(2, 2);

      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');
    });

    it('should allow resetting the merged cells by changing it to an empty array', async() => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ]
      });
      let TD = hot.rootElement.querySelector('td');

      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');

      await updateSettings({
        mergeCells: []
      });

      TD = hot.rootElement.querySelector('td');
      expect(TD.getAttribute('rowspan')).toBe(null);
      expect(TD.getAttribute('colspan')).toBe(null);
    });

    it('should allow resetting and turning off the mergeCells plugin by changing mergeCells to \'false\'', async() => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ]
      });
      let TD = hot.rootElement.querySelector('td');

      expect(TD.getAttribute('rowspan')).toBe('2');
      expect(TD.getAttribute('colspan')).toBe('2');

      await updateSettings({
        mergeCells: false
      });

      TD = hot.rootElement.querySelector('td');
      expect(TD.getAttribute('rowspan')).toBe(null);
      expect(TD.getAttribute('colspan')).toBe(null);
    });
  });

  describe('mergeCells copy', () => {
    it('should not copy text of cells that are merged into another cell', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ]
      });

      expect(getCopyableText(0, 0, 2, 2)).toBe('A1\t\tC1\n\t\tC2\nA3\tB3\tC3');
    });
  });

  describe('merged cells selection', () => {
    it('should not change the selection after toggling the merge/unmerge state', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: true
      });

      await selectCell(2, 2, 4, 4);
      await keyDownUp(['control', 'm']);

      const mergedCell = getCell(2, 2);

      expect(mergedCell.rowSpan).toBe(3);
      expect(mergedCell.colSpan).toBe(3);
      expect(getSelected()).toEqual([[2, 2, 4, 4]]);

      await keyDownUp(['control', 'm']);

      expect(mergedCell.rowSpan).toBe(1);
      expect(mergedCell.colSpan).toBe(1);
      expect(getSelected()).toEqual([[2, 2, 4, 4]]);
    });

    it('should select the whole range of cells which form a merged cell', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(4, 4),
        mergeCells: [
          {
            row: 0,
            col: 0,
            colspan: 4,
            rowspan: 1
          }
        ]
      });

      const $table = spec().$container.find('table.htCore');
      const $td = $table.find('tr:eq(0) td:eq(0)');

      expect($td.attr('rowspan')).toEqual('1');
      expect($td.attr('colspan')).toEqual('4');

      expect(getSelectedLast()).toBeUndefined();

      await selectCell(0, 0);

      expect(getSelectedLast()).toEqual([0, 0, 0, 3]);

      await deselectCell();

      await selectCell(0, 1);

      expect(getSelectedLast()).toEqual([0, 0, 0, 3]);
    });

    it('should always make a rectangular selection, when selecting merged and not merged cells', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(4, 4),
        mergeCells: [
          {
            row: 1,
            col: 1,
            colspan: 3,
            rowspan: 2
          }
        ]
      });

      const $table = spec().$container.find('table.htCore');
      const $td = $table.find('tr:eq(1) td:eq(1)');

      expect($td.attr('rowspan')).toEqual('2');
      expect($td.attr('colspan')).toEqual('3');

      expect(getSelectedLast()).toBeUndefined();

      await selectCell(0, 0);

      expect(getSelectedLast()).toEqual([0, 0, 0, 0]);

      await deselectCell();

      await selectCell(0, 0, 1, 1);

      expect(getSelectedLast()).not.toEqual([0, 0, 1, 1]);
      expect(getSelectedLast()).toEqual([0, 0, 2, 3]);

      await deselectCell();

      await selectCell(0, 1, 1, 1);

      expect(getSelectedLast()).toEqual([0, 1, 2, 3]);
    });

    it('should not switch the selection start point when selecting from non-merged cells to merged cells', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 10),
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 3 },
          { row: 3, col: 4, rowspan: 2, colspan: 2 }
        ]
      });

      $(getCell(6, 6)).simulate('mousedown');

      expect(getSelectedRangeLast().from.col).toEqual(6);
      expect(getSelectedRangeLast().from.row).toEqual(6);

      $(getCell(1, 1)).simulate('mouseenter');

      expect(getSelectedRangeLast().from.col).toEqual(6);
      expect(getSelectedRangeLast().from.row).toEqual(6);

      $(getCell(3, 3)).simulate('mouseenter');

      expect(getSelectedRangeLast().from.col).toEqual(6);
      expect(getSelectedRangeLast().from.row).toEqual(6);

      $(getCell(4, 4)).simulate('mouseenter');

      expect(getSelectedRangeLast().from.col).toEqual(6);
      expect(getSelectedRangeLast().from.row).toEqual(6);
    });

    // TODO: After some changes please take a look at #7010 (test for unspecified behavior)
    it('should select cells in the correct direction when changing selections around a merged range', async() => {
      handsontable({
        data: createSpreadsheetObjectData(10, 10),
        mergeCells: [
          { row: 4, col: 4, rowspan: 2, colspan: 2 }
        ]
      });

      await selectCell(5, 5, 5, 2);

      expect(getSelectedRangeLast().getDirection()).toEqual('NE-SW');
      // Rectangular area from the marginal cell to the cell on the opposite.
      expect(getSelected()).toEqual([[4, 5, 5, 2]]);

      // What about, for example: selectCell(5, 4, 5, 2);
      // Is it specified properly?
      await selectCell(4, 4, 2, 5);

      expect(getSelectedRangeLast().getDirection()).toEqual('SW-NE');
      // It flips the selection direction vertically.
      expect(getSelected()).toEqual([[5, 4, 2, 5]]);

      await selectCell(4, 4, 5, 7);

      expect(getSelectedRangeLast().getDirection()).toEqual('NW-SE');
      expect(getSelected()).toEqual([[4, 4, 5, 7]]);

      await selectCell(4, 5, 7, 5);

      expect(getSelectedRangeLast().getDirection()).toEqual('NW-SE');
      // It flips the selection direction horizontally.
      expect(getSelected()).toEqual([[4, 4, 7, 5]]);
    });

    it('should not add an area class to the selected cell if a single merged cell is selected', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(6, 6),
        mergeCells: [
          {
            row: 1,
            col: 1,
            colspan: 3,
            rowspan: 2
          }
        ]
      });

      await selectCell(1, 1);
      expect(getCell(1, 1).className.indexOf('area')).toEqual(-1);

      await selectCell(1, 1, 4, 4);
      expect(getCell(1, 1).className.indexOf('area')).not.toEqual(-1);

      await selectCell(1, 1);
      expect(getCell(1, 1).className.indexOf('area')).toEqual(-1);

      await selectCell(0, 0);
      expect(getCell(1, 1).className.indexOf('area')).toEqual(-1);
    });

    it('should render fill handle after merge cells', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: true
      });

      const plugin = getPlugin('mergeCells');

      await selectCell(0, 0, 2, 2);
      plugin.mergeSelection();

      expect(spec().$container.find('.wtBorder.current.corner:visible').length).toEqual(1);
    });

    it('should render fill handle when merge cells is highlighted cell in right bottom corner', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 2, col: 2, rowspan: 2, colspan: 2 }
        ]
      });

      await selectCell(2, 2, 1, 1);

      expect(spec().$container.find('.wtBorder.corner:visible').length).toEqual(1);
    });

    it('should render fill handle when cell in right bottom corner is a merged cell', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 2, col: 2, rowspan: 2, colspan: 2 }
        ]
      });

      await selectCell(1, 1, 2, 2);

      expect(spec().$container.find('.wtBorder.corner:visible').length).toEqual(1);
    });

    it('should select the cell in the top-left corner of the merged cell, when navigating down using the ENTER key on the' +
      ' bottom edge of the table', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        autoWrapRow: true,
        autoWrapCol: true,
        mergeCells: [
          { row: 8, col: 8, rowspan: 2, colspan: 2 }
        ]
      });

      await setDataAtCell(8, 8, 'top-left-corner!');
      await selectCell(7, 9);

      await keyDownUp('enter');
      await keyDownUp('enter');
      await keyDownUp('enter');

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('top-left-corner!');

      await keyDownUp('enter');
      await keyDownUp('enter');

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A1');

      await keyDownUp('enter');
      await keyDownUp('enter');

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A2');
    });

    it('should not select the cell in the top-left corner of the merged cell, when navigating down using the TAB key on the' +
      ' bottom edge of the table', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 8, col: 8, rowspan: 2, colspan: 2 }
        ],
        autoWrapCol: false,
        autoWrapRow: false
      });

      await setDataAtCell(8, 8, 'top-left-corner!');
      await selectCell(9, 7);

      await keyDownUp('enter');
      await keyDownUp('tab');
      await keyDownUp('enter');

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('top-left-corner!');

      await keyDownUp('tab');
      await keyDownUp('enter');

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('');

      await keyDownUp('tab');
      await keyDownUp('enter');

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('');
    });

    it('should select the cell in the top-left corner of the merged cell, when navigating down using the SHIFT + ENTER key on the' +
      ' top edge of the table', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ],
        autoWrapCol: false,
        autoWrapRow: false
      });

      await setDataAtCell(0, 0, 'top-left-corner!');

      await selectCell(2, 1);

      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('top-left-corner!');

      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('top-left-corner!');

      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('top-left-corner!');
    });

    it('should select the cell in the top-left corner of the merged cell, when navigating down using the SHIFT + TAB key on the' +
      ' top edge of the table', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ],
        autoWrapRow: true,
        autoWrapCol: true,
      });

      await setDataAtCell(0, 0, 'top-left-corner!');

      await selectCell(1, 2);

      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'enter']);

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('top-left-corner!');

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'enter']);

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('J1');

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'enter']);

      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('I1');
    });

    describe('compatibility with other plugins', () => {
      it('should be possible to traverse through columns using the DOWN ARROW or ENTER, when there\'s a' +
        ' partially-hidden merged cell in the way', async() => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          hiddenColumns: {
            columns: [1],
            indicators: true
          },
          mergeCells: [
            { row: 1, col: 1, rowspan: 2, colspan: 2 }
          ]
        });

        await selectCell(0, 2);

        await keyDownUp('enter');
        await keyDownUp('enter');

        let lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp('enter');
        await keyDownUp('enter');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(3, 2));

        await selectCell(0, 2);

        await keyDownUp('arrowdown');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp('arrowdown');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(3, 2));
      });

      it('should be possible to traverse through columns using the UP ARROW or SHIFT+ENTER, when there\'s a' +
        ' partially-hidden merged cell in the way', async() => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          hiddenColumns: {
            columns: [1],
            indicators: true
          },
          mergeCells: [
            { row: 1, col: 1, rowspan: 2, colspan: 2 }
          ]
        });

        await selectCell(3, 2);

        await keyDownUp(['shift', 'enter']);
        await keyDownUp(['shift', 'enter']);

        let lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp(['shift', 'enter']);
        await keyDownUp(['shift', 'enter']);

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(0, 2));

        await selectCell(3, 2);

        await keyDownUp('arrowup');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp('arrowup');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(0, 2));
      });

      it('should be possible to traverse through columns using the RIGHT ARROW or TAB, when there\'s a' +
        ' partially-hidden merged cell in the way', async() => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          hiddenRows: {
            rows: [1],
            indicators: true
          },
          mergeCells: [
            { row: 1, col: 1, rowspan: 2, colspan: 2 }
          ]
        });

        await selectCell(2, 0);

        await keyDownUp('tab');

        let lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp('tab');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 3));

        await selectCell(2, 0);

        await keyDownUp('arrowright');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp('arrowright');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 3));
      });

      it('should be possible to traverse through columns using the LEFT ARROW or SHIFT+TAB, when there\'s a' +
        ' partially-hidden merged cell in the way', async() => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          hiddenRows: {
            rows: [1],
            indicators: true
          },
          mergeCells: [
            { row: 1, col: 1, rowspan: 2, colspan: 2 }
          ]
        });

        await selectCell(2, 3);

        await keyDownUp(['shift', 'tab']);

        let lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp(['shift', 'tab']);

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 0));

        await selectCell(2, 3);

        await keyDownUp('arrowleft');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 2));

        await keyDownUp('arrowleft');

        lastSelectedRange = getSelectedRangeLast();

        expect(getCell(lastSelectedRange.highlight.row, lastSelectedRange.highlight.col)).toEqual(getCell(2, 0));
      });
    });
  });

  describe('merge cells shift', () => {
    it('should shift the merged cells right, when inserting a column on the left side of them', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 3, col: 5, rowspan: 2, colspan: 1 },
          { row: 3, col: 6, rowspan: 2, colspan: 1 },
        ],
        height: 400,
        width: 400
      });

      await alter('insert_col_start', 3, 2);

      const cellsCollection = getPlugin('mergeCells').mergedCellsCollection;

      expect(cellsCollection.get(1, 1).col).toBe(1);
      expect(cellsCollection.get(3, 3)).toBe(false);
      expect(cellsCollection.get(3, 4)).toBe(false);
      expect(cellsCollection.get(3, 5)).toBe(false);
      expect(cellsCollection.get(3, 6)).toBe(false);
      expect(cellsCollection.get(3, 7).col).toBe(7);
      expect(cellsCollection.get(3, 8).col).toBe(8);
      expect(cellsCollection.get(3, 9)).toBe(false);
    });

    it('should shift the merged cells left, when removing a column on the left side of them', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 3, col: 5, rowspan: 2, colspan: 1 },
          { row: 3, col: 6, rowspan: 2, colspan: 1 },
        ],
        height: 400,
        width: 400
      });

      await alter('remove_col', 3, 2);

      const cellsCollection = getPlugin('mergeCells').mergedCellsCollection;

      expect(cellsCollection.get(1, 1).col).toBe(1);
      expect(cellsCollection.get(3, 3).col).toBe(3);
      expect(cellsCollection.get(3, 4).col).toBe(4);
      expect(cellsCollection.get(3, 5)).toBe(false);
      expect(cellsCollection.get(3, 6)).toBe(false);
      expect(cellsCollection.get(3, 7)).toBe(false);

    });

    it('should shift the merged cells down, when inserting rows above them', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 1, col: 1, rowspan: 1, colspan: 2 },
          { row: 5, col: 5, rowspan: 2, colspan: 2 },
          { row: 7, col: 5, rowspan: 2, colspan: 2 },
        ],
        height: 400,
        width: 400
      });

      await alter('insert_row_above', 3, 2);

      const cellsCollection = getPlugin('mergeCells').mergedCellsCollection;

      expect(cellsCollection.get(1, 1).row).toBe(1);
      expect(cellsCollection.get(5, 5)).toBe(false);
      expect(cellsCollection.get(6, 5)).toBe(false);
      expect(cellsCollection.get(7, 5).row).toBe(7);
      expect(cellsCollection.get(8, 5).row).toBe(7);
      expect(cellsCollection.get(9, 5).row).toBe(9);
      expect(cellsCollection.get(10, 5).row).toBe(9);
    });

    it('should shift the merged cells up, when removing rows above them', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
          { row: 5, col: 5, rowspan: 2, colspan: 2 },
          { row: 7, col: 5, rowspan: 2, colspan: 2 },
        ],
        height: 400,
        width: 400
      });

      await alter('remove_row', 3, 2);

      const cellsCollection = getPlugin('mergeCells').mergedCellsCollection;

      expect(cellsCollection.get(1, 1).row).toBe(1);
      expect(cellsCollection.get(2, 5)).toBe(false);
      expect(cellsCollection.get(3, 5).row).toBe(3);
      expect(cellsCollection.get(4, 5).row).toBe(3);
      expect(cellsCollection.get(5, 5).row).toBe(5);
      expect(cellsCollection.get(6, 5).row).toBe(5);
      expect(cellsCollection.get(7, 5)).toBe(false);
    });

    it('should trim the merged cell\'s height, when removing rows between their start and end', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 1, col: 1, rowspan: 5, colspan: 3 }
        ],
        height: 400,
        width: 400
      });

      await alter('remove_row', 2, 2);

      const plugin = getPlugin('mergeCells');
      const mergedCellsCollection = plugin.mergedCellsCollection.mergedCells;

      expect(mergedCellsCollection[0].row).toEqual(1);
      expect(mergedCellsCollection[0].rowspan).toEqual(3);

      plugin.mergedCellsCollection.clear();
      plugin.merge(1, 1, 2, 2);

      await alter('remove_row', 2, 2);

      expect(mergedCellsCollection[0].row).toEqual(1);
      expect(mergedCellsCollection[0].rowspan).toEqual(1);
    });

    it('should trim the merged cell\'s width, when removing columns between their start and end', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 1, col: 1, rowspan: 3, colspan: 5 }
        ],
        height: 400,
        width: 400
      });

      await alter('remove_col', 2, 2);

      const plugin = getPlugin('mergeCells');
      const mergedCellsCollection = plugin.mergedCellsCollection.mergedCells;

      expect(mergedCellsCollection[0].col).toEqual(1);
      expect(mergedCellsCollection[0].colspan).toEqual(3);

      plugin.mergedCellsCollection.clear();
      plugin.merge(1, 1, 2, 2);

      await alter('remove_col', 2, 2);

      expect(mergedCellsCollection[0].col).toEqual(1);
      expect(mergedCellsCollection[0].colspan).toEqual(1);
    });

    it('should shift the `row` of a merged cells, when removing rows consisting it', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 5, col: 5, rowspan: 5, colspan: 3 }
        ],
        height: 400,
        width: 400
      });

      await alter('remove_row', 4, 3);

      const plugin = getPlugin('mergeCells');
      const mergedCellsCollection = plugin.mergedCellsCollection.mergedCells;

      expect(mergedCellsCollection[0].row).toEqual(4);
      expect(mergedCellsCollection[0].rowspan).toEqual(3);

      plugin.mergedCellsCollection.clear();
      plugin.merge(1, 1, 2, 2);

      await alter('remove_row', 0, 2);

      expect(mergedCellsCollection[0].row).toEqual(0);
      expect(mergedCellsCollection[0].rowspan).toEqual(1);

      plugin.mergedCellsCollection.clear();
      plugin.merge(1, 1, 2, 2);

      await alter('remove_row', 1, 1);

      expect(mergedCellsCollection[0].row).toEqual(1);
      expect(mergedCellsCollection[0].rowspan).toEqual(1);
    });

    it('should shift the `col` of a merged cells, when removing columns consisting it', async() => {
      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 5, col: 5, rowspan: 3, colspan: 5 }
        ],
        height: 400,
        width: 400
      });

      await alter('remove_col', 4, 3);

      const plugin = getPlugin('mergeCells');
      const mergedCellsCollection = plugin.mergedCellsCollection.mergedCells;

      expect(mergedCellsCollection[0].col).toEqual(4);
      expect(mergedCellsCollection[0].colspan).toEqual(3);

      plugin.mergedCellsCollection.clear();
      plugin.merge(1, 1, 2, 2);

      await alter('remove_col', 0, 2);

      expect(mergedCellsCollection[0].col).toEqual(0);
      expect(mergedCellsCollection[0].colspan).toEqual(1);

      plugin.mergedCellsCollection.clear();
      plugin.merge(1, 1, 2, 2);

      await alter('remove_col', 1, 1);

      expect(mergedCellsCollection[0].col).toEqual(1);
      expect(mergedCellsCollection[0].colspan).toEqual(1);
    });

    it('should allow removing multiple merged cells, while removing multiple rows', async() => {
      const errorSpy = spyOn(console, 'error');

      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 },
          { row: 5, col: 5, rowspan: 3, colspan: 3 }
        ],
        height: 400,
        width: 400
      });

      await alter('remove_row', 0, 10);

      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('merged cell candidates validation', () => {
    it('should check if the provided merged cell information object contains negative values, and if so, do not add it ' +
      'to the collection and throw an appropriate warning', async() => {
      const warnSpy = spyOnConsoleWarn();
      const newMergedCells = [
        {
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        },
        {
          row: -5,
          col: 8,
          rowspan: 3,
          colspan: 4
        },
        {
          row: 20,
          col: -21,
          rowspan: 3,
          colspan: 4
        },
        {
          row: 200,
          col: 210,
          rowspan: -3,
          colspan: 4
        },
        {
          row: 220,
          col: 220,
          rowspan: 3,
          colspan: -4
        }];

      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: newMergedCells
      });

      expect(warnSpy)
        .toHaveBeenCalledWith('The merged cell declared with {row: -5, col: 8, rowspan: 3, colspan: 4} ' +
          'contains negative values, which is not supported. It will not be added to the collection.');
      expect(warnSpy)
        .toHaveBeenCalledWith('The merged cell declared with {row: 20, col: -21, rowspan: 3, colspan: 4} ' +
          'contains negative values, which is not supported. It will not be added to the collection.');
      expect(warnSpy)
        .toHaveBeenCalledWith('The merged cell declared with {row: 200, col: 210, rowspan: -3, colspan: 4} ' +
          'contains negative values, which is not supported. It will not be added to the collection.');
      expect(warnSpy)
        .toHaveBeenCalledWith('The merged cell declared with {row: 220, col: 220, rowspan: 3, colspan: -4} ' +
          'contains negative values, which is not supported. It will not be added to the collection.');

      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toEqual(1);
    });

    it('should check if the provided merged cell information object has rowspan and colspan declared as 0, and if so, do not add it ' +
      'to the collection and throw an appropriate warning', async() => {
      const warnSpy = spyOnConsoleWarn();
      const newMergedCells = [
        {
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        },
        {
          row: 6,
          col: 6,
          rowspan: 0,
          colspan: 0
        },
        {
          row: 9,
          col: 9,
          rowspan: 1,
          colspan: 0
        }
      ];

      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: newMergedCells
      });

      expect(warnSpy).toHaveBeenCalledWith('The merged cell declared at [6, 6] has "rowspan" or ' +
        '"colspan" declared as "0", which is not supported. It cannot be added to the collection.');
      expect(warnSpy).toHaveBeenCalledWith('The merged cell declared at [9, 9] has "rowspan" or ' +
        '"colspan" declared as "0", which is not supported. It cannot be added to the collection.');

      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toEqual(1);
    });

    it('should check if the provided merged cell information object represents a single cell, and if so, do not add it ' +
      'to the collection and throw an appropriate warning', async() => {
      const warnSpy = spyOnConsoleWarn();
      const newMergedCells = [
        {
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        },
        {
          row: 5,
          col: 8,
          rowspan: 1,
          colspan: 1
        },
        {
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        }
      ];

      handsontable({
        data: createSpreadsheetData(30, 30),
        mergeCells: newMergedCells
      });

      expect(warnSpy).toHaveBeenCalledWith('The merged cell declared at [5, 8] has both "rowspan" and "colspan" ' +
        'declared as "1", which makes it a single cell. It cannot be added to the collection.');
      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toEqual(2);
    });

    it('should check if the provided merged cell information object contains merged declared out of bounds, and if so, ' +
      'do not add it to the collection and throw an appropriate warning', async() => {
      const warnSpy = spyOnConsoleWarn();
      const newMergedCells = [
        {
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        },
        {
          row: 17,
          col: 17,
          rowspan: 5,
          colspan: 5
        },
        {
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        }
      ];

      handsontable({
        data: createSpreadsheetData(20, 20),
        mergeCells: newMergedCells
      });

      expect(warnSpy).toHaveBeenCalledWith('The merged cell declared at [17, 17] is positioned ' +
        '(or positioned partially) outside of the table range. It was not added to the table, please fix your setup.');
      expect(warnSpy).toHaveBeenCalledWith('The merged cell declared at [20, 21] is positioned ' +
        '(or positioned partially) outside of the table range. It was not added to the table, please fix your setup.');
      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toEqual(1);
    });
  });

  describe('ContextMenu', () => {
    it('should disable `Merge cells` context menu item when context menu was triggered from corner header', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        mergeCells: true,
      });

      const corner = $('.ht_clone_top_inline_start_corner .htCore').find('thead').find('th').eq(0);

      await simulateClick(corner, 'RMB');
      await contextMenu();

      expect($('.htContextMenu tbody td.htDisabled').text()).toBe([
        'Insert column left',
        'Insert column right',
        'Remove columns',
        'Undo',
        'Redo',
        'Read only',
        'Alignment',
        'Merge cells',
      ].join(''));
    });
  });

  describe('Validation', () => {
    it('should not hide the merged cells after validating the table', async() => {
      const onAfterValidate = jasmine.createSpy('onAfterValidate');

      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 5, col: 4, rowspan: 2, colspan: 2 },
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
        ],
        validator(query, callback) {
          callback(true);
        },
        afterValidate: onAfterValidate
      });

      let firstCollection = getCell(5, 4);
      let secondCollection = getCell(1, 1);

      expect(firstCollection.style.display.indexOf('none')).toEqual(-1);
      expect(secondCollection.style.display.indexOf('none')).toEqual(-1);

      await validateCells();
      await sleep(300);

      expect(onAfterValidate).toHaveBeenCalled();

      firstCollection = getCell(5, 4);
      secondCollection = getCell(1, 1);

      expect(firstCollection.style.display.indexOf('none')).toEqual(-1);
      expect(secondCollection.style.display.indexOf('none')).toEqual(-1);
    });
  });

  describe('Entire row/column selection', () => {
    it('should be possible to select a single entire column, when there\'s a merged cell in it', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 5, col: 4, rowspan: 2, colspan: 5 }
        ]
      });

      await selectColumns(5);

      expect(getSelectedLast()).toEqual([0, 5, 9, 5]);

      // it should work only for selecting the entire column
      await selectCell(4, 5, 7, 5);

      expect(getSelectedLast()).toEqual([4, 4, 7, 8]);
    });

    it('should be possible to select a single entire row, when there\'s a merged cell in it', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 5, col: 4, rowspan: 5, colspan: 2 }
        ]
      });

      await selectRows(5);

      expect(getSelectedLast()).toEqual([5, 0, 5, 9]);

      // it should work only for selecting the entire row
      await selectCell(6, 3, 6, 7);

      expect(getSelectedLast()).toEqual([5, 3, 9, 7]);
    });
  });

  describe('Undo/Redo', () => {
    it('should not be possible to remove initially declared merged cells by calling the \'Undo\' action.', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: [
          { row: 5, col: 4, rowspan: 2, colspan: 5 },
          { row: 1, col: 1, rowspan: 2, colspan: 2 },
        ]
      });

      getPlugin('undoRedo').undo();

      expect(getPlugin('mergeCells').mergedCellsCollection.mergedCells.length).toEqual(2);
    });

    it('should be possible undo the merging process by calling the \'Undo\' action.', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: true
      });

      const plugin = getPlugin('mergeCells');

      plugin.merge(0, 0, 3, 3);
      await selectCell(4, 4, 7, 7);
      plugin.mergeSelection();

      expect(plugin.mergedCellsCollection.mergedCells.length).toEqual(2);
      getPlugin('undoRedo').undo();
      expect(plugin.mergedCellsCollection.mergedCells.length).toEqual(1);
      getPlugin('undoRedo').undo();
      expect(plugin.mergedCellsCollection.mergedCells.length).toEqual(0);
    });

    it('should be possible redo the merging process by calling the \'Redo\' action.', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        mergeCells: true
      });

      const plugin = getPlugin('mergeCells');

      plugin.merge(0, 0, 3, 3);
      await selectCell(4, 4, 7, 7);
      plugin.mergeSelection();

      getPlugin('undoRedo').undo();
      getPlugin('undoRedo').undo();

      getPlugin('undoRedo').redo();
      expect(plugin.mergedCellsCollection.mergedCells.length).toEqual(1);
      getPlugin('undoRedo').redo();
      expect(plugin.mergedCellsCollection.mergedCells.length).toEqual(2);
    });
  });

  describe('cooperation with the `Autofill` plugin', () => {
    it('should add new merged areas when dragged the merged cell', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 2 }
        ],
        fillHandle: true
      });

      await selectCell(0, 0);

      // Dragging merged cell one level down.
      simulateFillHandleDrag(getCell(2, 0));

      // First merged cell.
      expect(spec().$container.find('tr:eq(0) td:eq(0)')[0].offsetWidth).toBe(100);
      expect(spec().$container.find('tr:eq(0) td:eq(0)')[0].offsetHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(47);
        main.toBe(59);
        horizon.toBe(75);
      });
      expect(getCell(0, 1).innerText).toBe('A1');
      expect(getDataAtCell(0, 0)).toBe('A1');
      // Already populated merged cell.
      expect(spec().$container.find('tr:eq(2) td:eq(0)')[0].offsetWidth).toBe(100);
      expect(spec().$container.find('tr:eq(2) td:eq(0)')[0].offsetHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(46);
        main.toBe(58);
        horizon.toBe(74);
      });
      expect(getCell(2, 1).innerText).toBe('A1');
      expect(getDataAtCell(2, 0)).toBe('A1');

      await selectCell(0, 0);

      // Dragging merged cell one level right.
      simulateFillHandleDrag(getCell(0, 2));

      // First merged cell.
      expect(spec().$container.find('tr:eq(0) td:eq(0)')[0].offsetWidth).toBe(100);
      expect(spec().$container.find('tr:eq(0) td:eq(0)')[0].offsetHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(47);
        main.toBe(59);
        horizon.toBe(75);
      });
      expect(getCell(0, 1).innerText).toBe('A1');
      expect(getDataAtCell(0, 0)).toBe('A1');
      // Previously populated merged cell.
      expect(spec().$container.find('tr:eq(2) td:eq(0)')[0].offsetWidth).toBe(100);
      expect(spec().$container.find('tr:eq(2) td:eq(0)')[0].offsetHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(46);
        main.toBe(58);
        horizon.toBe(74);
      });
      expect(getCell(2, 1).innerText).toBe('A1');
      expect(getDataAtCell(2, 0)).toBe('A1');
      // Already populated merged cell.
      expect(spec().$container.find('tr:eq(0) td:eq(2)')[0].offsetWidth).toBe(100);
      expect(spec().$container.find('tr:eq(0) td:eq(2)')[0].offsetHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(47);
        main.toBe(59);
        horizon.toBe(75);
      });
      expect(getCell(0, 3).innerText).toBe('A1');
      expect(getDataAtCell(0, 2)).toBe('A1');

      expect($(getHtCore())[0].offsetWidth).toBe(5 * 50);
      expect($(getHtCore())[0].offsetHeight).forThemes(({ classic, main, horizon }) => {
        classic.toBe(24 + (4 * 23)); // First row is 1px higher than others.
        main.toBe(30 + (4 * 29));
        horizon.toBe(38 + (4 * 37));
      });
    });
  });

  describe('Hooks', () => {
    it('should trigger the `beforeOnCellMouseDown` hook with proper coords', async() => {
      let rowOnCellMouseDown;
      let columnOnCellMouseDown;
      let coordsOnCellMouseDown;

      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 4 }],
        beforeOnCellMouseDown(_, coords) {
          coordsOnCellMouseDown = coords;
          rowOnCellMouseDown = coords.row;
          columnOnCellMouseDown = coords.col;
        }
      });

      // Click on the first visible cell (merged area).
      await simulateClick(spec().$container.find('tr:eq(1) td:eq(0)'));

      expect(rowOnCellMouseDown).toEqual(0);
      expect(columnOnCellMouseDown).toEqual(0);
      expect(coordsOnCellMouseDown).toEqual(jasmine.objectContaining({ row: 0, col: 0 }));
    });

    it('should trigger the `afterOnCellMouseDown` hook with proper coords', async() => {
      let rowOnCellMouseDown;
      let columnOnCellMouseDown;
      let coordsOnCellMouseDown;

      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 4 }],
        afterOnCellMouseDown(_, coords) {
          coordsOnCellMouseDown = coords;
          rowOnCellMouseDown = coords.row;
          columnOnCellMouseDown = coords.col;
        }
      });

      // Click on the first visible cell (merged area).
      await simulateClick(spec().$container.find('tr:eq(1) td:eq(0)'));

      expect(rowOnCellMouseDown).toEqual(0);
      expect(columnOnCellMouseDown).toEqual(0);
      expect(coordsOnCellMouseDown).toEqual(jasmine.objectContaining({ row: 0, col: 0 }));
    });
  });

  it('`getCell` should return merged cell parent', async() => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
      mergeCells: [
        { row: 0, col: 0, rowspan: 2, colspan: 2 }
      ],
      height: 100,
      width: 400
    });

    const mergedCellParent = getCell(0, 0);
    const mergedCellHidden = getCell(1, 1);

    expect(mergedCellHidden).toBe(mergedCellParent);
  });

  it('should set/unset "copyable" cell meta attribute after performing merge/unmerge', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      mergeCells: true
    });

    await selectCell(2, 2, 4, 4);
    await keyDownUp(['control', 'm']);

    expect(getCellMeta(2, 2).copyable).toBe(true);
    expect(getCellMeta(2, 3).copyable).toBe(false);
    expect(getCellMeta(2, 4).copyable).toBe(false);
    expect(getCellMeta(3, 3).copyable).toBe(false);
    expect(getCellMeta(3, 4).copyable).toBe(false);
    expect(getCellMeta(4, 4).copyable).toBe(false);

    await keyDownUp(['control', 'm']);

    expect(getCellMeta(2, 2).copyable).toBe(true);
    expect(getCellMeta(2, 3).copyable).toBe(true);
    expect(getCellMeta(2, 4).copyable).toBe(true);
    expect(getCellMeta(3, 3).copyable).toBe(true);
    expect(getCellMeta(3, 4).copyable).toBe(true);
    expect(getCellMeta(4, 4).copyable).toBe(true);

    await keyDownUp(['control', 'm']);

    expect(getCellMeta(2, 2).copyable).toBe(true);
    expect(getCellMeta(2, 3).copyable).toBe(false);
    expect(getCellMeta(2, 4).copyable).toBe(false);
    expect(getCellMeta(3, 3).copyable).toBe(false);
    expect(getCellMeta(3, 4).copyable).toBe(false);
    expect(getCellMeta(4, 4).copyable).toBe(false);
  });

  it('should not collapse the main table\'s row height when the merge cell covers all cells width', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      mergeCells: true,
    });

    await updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 5 }],
    });

    expect(getCell(0, 0).offsetHeight).forThemes(({ classic, main, horizon }) => {
      classic.toBe(70);
      main.toBe(88);
      horizon.toBe(112);
    });
  });

  it('should not collapse the left overlay height when the merge cell covers all overlay cells width', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      fixedColumnsStart: 1,
      mergeCells: true,
    });

    await updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 1 }],
    });

    expect(getInlineStartClone().find('.htCore').height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(116);
      main.toBe(146);
      horizon.toBe(186);
    });

    await updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 2 }],
    });

    expect(getInlineStartClone().find('.htCore').height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(116);
      main.toBe(146);
      horizon.toBe(186);
    });

    await updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 3 }],
    });

    expect(getInlineStartClone().find('.htCore').height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(116);
      main.toBe(146);
      horizon.toBe(186);
    });
  });

  xit('should not collapse the top overlay height when the merge cell covers all overlay cells width', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      fixedRowsTop: 2,
      mergeCells: true,
    });

    await updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 5 }],
    });

    expect(getTopClone().height()).toBe(70);

    await updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 5 }],
    });

    expect(getTopClone().height()).toBe(47);

    await updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 5 }],
    });

    expect(getTopClone().height()).toBe(47);
  });

  it('should correctly render all overlay\'s heights when they are contain merge cells', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      width: 600,
      height: 400,
      fixedColumnsStart: 1,
      fixedRowsTop: 3,
      mergeCells: [
        { row: 0, col: 0, rowspan: 5, colspan: 1 },
        { row: 0, col: 3, rowspan: 3, colspan: 1 },
        { row: 0, col: 5, rowspan: 8, colspan: 1 },
      ],
    });

    expect(getTopInlineStartClone().height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(70);
      main.toBe(88);
      horizon.toBe(112);
    });
    expect(getTopClone().height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(70);
      main.toBe(88);
      horizon.toBe(112);
    });
    expect(getInlineStartClone().height()).toBe(400);
  });

  it('should expand the all overlays size after changing the row height', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      width: 600,
      height: 400,
      autoRowSize: true, // the autoRowSize plugin is mandatory
      fixedColumnsStart: 1,
      fixedRowsTop: 3,
      mergeCells: [
        { row: 0, col: 0, rowspan: 5, colspan: 1 },
        { row: 0, col: 3, rowspan: 3, colspan: 1 },
        { row: 0, col: 5, rowspan: 8, colspan: 1 },
      ],
    });

    await selectCell(1, 1);
    await keyDownUp('enter');
    getActiveEditor().TEXTAREA.value = 'test\n\ntest';
    await keyDownUp('enter');

    expect(getTopInlineStartClone().height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(111);
      main.toBe(128);
      horizon.toBe(152);
    });
    expect(getTopClone().height()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(111);
      main.toBe(128);
      horizon.toBe(152);
    });
    expect(getInlineStartClone().height()).toBe(400);
  });

  it('should display properly wide merged cell', async() => {
    handsontable({
      data: createSpreadsheetData(3, 30),
      width: 200,
      height: 200,
      viewportColumnRenderingOffset: 0,
      mergeCells: true,
    });

    getPlugin('mergeCells').merge(0, 0, 0, 20);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('A1');
    expect(`
      | #                                                                                 |
      |   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
      |   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 0, col: 22 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('W1');
    expect(`
      | #                                                                                 :   :   |
      |   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
      |   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 0, col: 25 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('W1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('Z1');
    expect(`
      |   :   :   :   |
      |   :   :   :   |
      |   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should display properly wide virtualized merged cell', async() => {
    handsontable({
      data: createSpreadsheetData(3, 30),
      width: 200,
      height: 200,
      viewportColumnRenderingOffset: 0,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 0, 20);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('A1');
    expect(`
      | #             |
      |   :   :   :   |
      |   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 0, col: 22 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('W1');
    expect(`
      | #     :   :   |
      |   :   :   :   |
      |   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 0, col: 25 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('W1');
    expect(getHtCore().find('tr:first td:last').text()).toBe('Z1');
    expect(`
      |   :   :   :   |
      |   :   :   :   |
      |   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should correctly calculate the height of the merged cell for custom defined height (the first column as merged cell, row headers enabled)', async() => {
    handsontable({
      data: createSpreadsheetData(6, 3),
      rowHeaders: true,
      rowHeights: 50,
      mergeCells: [{ row: 0, col: 0, rowspan: 6, colspan: 1 }],
    });

    expect(getCell(0, 0).offsetHeight).forThemes(({ classic, main, horizon }) => {
      classic.toBe(301);
      main.toBe(300);
      horizon.toBe(300);
    });
  });

  it('should correctly calculate the height of the merged cell for custom defined height (the first column as merged cell, row headers disabled)', async() => {
    handsontable({
      data: createSpreadsheetData(6, 3),
      rowHeaders: false,
      rowHeights: 50,
      mergeCells: [{ row: 0, col: 0, rowspan: 6, colspan: 1 }],
    });

    expect(getCell(0, 0).offsetHeight).forThemes(({ classic, main, horizon }) => {
      classic.toBe(301);
      main.toBe(300);
      horizon.toBe(300);
    });
  });

  it('should correctly calculate the height of the merged cell for custom defined height (the second column as merged cell)', async() => {
    handsontable({
      data: createSpreadsheetData(6, 3),
      rowHeaders: false,
      rowHeights: 50,
      mergeCells: [{ row: 0, col: 1, rowspan: 6, colspan: 1 }],
    });

    expect(getCell(0, 1).offsetHeight).forThemes(({ classic, main, horizon }) => {
      classic.toBe(301);
      main.toBe(300);
      horizon.toBe(300);
    });
  });

  it('should correctly calculate the height of the merged cell for custom defined height (the second column as non-fully merged cell)', async() => {
    handsontable({
      data: createSpreadsheetData(6, 3),
      rowHeaders: false,
      rowHeights: 50,
      mergeCells: [{ row: 0, col: 1, rowspan: 4, colspan: 1 }],
    });

    expect(getCell(0, 1).offsetHeight).forThemes(({ classic, main, horizon }) => {
      classic.toBe(201);
      main.toBe(200);
      horizon.toBe(200);
    });
  });

  it('should proportionally calculate the height of the cells on the right of the merged cell (#dev-2302)', async() => {
    handsontable({
      data: createSpreadsheetData(4, 3),
      rowHeaders: false,
      rowHeights: 50,
      mergeCells: [{ row: 0, col: 0, rowspan: 4, colspan: 1 }],
    });

    expect(getCell(0, 0).offsetHeight).forThemes(({ classic, main, horizon }) => {
      classic.toBe(201);
      main.toBe(200);
      horizon.toBe(200);
    });
    expect(getCell(0, 1).offsetHeight).forThemes(({ classic, main, horizon }) => {
      classic.toBe(51);
      main.toBe(50);
      horizon.toBe(50);
    });
    expect(getCell(0, 1).offsetHeight).forThemes(({ classic, main, horizon }) => {
      classic.toBe(51);
      main.toBe(50);
      horizon.toBe(50);
    });
    expect(getCell(1, 1).offsetHeight).toBe(50);
    expect(getCell(2, 1).offsetHeight).toBe(50);
    expect(getCell(3, 1).offsetHeight).toBe(50);
  });

  it('should respect the row heights when the first column is merged (#dev-2653)', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      rowHeaders: false,
      rowHeights: [80, 180, 60],
      mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }],
    });

    expect(getCell(0, 0).offsetHeight).forThemes(({ classic, main, horizon }) => {
      classic.toBe(261);
      main.toBe(260);
      horizon.toBe(260);
    });
    expect(getCell(0, 1).offsetHeight).forThemes(({ classic, main, horizon }) => {
      classic.toBe(81);
      main.toBe(80);
      horizon.toBe(80);
    });
    expect(getCell(1, 1).offsetHeight).forThemes(({ classic, main, horizon }) => {
      classic.toBe(180);
      main.toBe(180);
      horizon.toBe(180);
    });
    expect(getCell(2, 1).offsetHeight).toBe(60);
  });

  it.forTheme('classic')('should display properly high merged cell', async() => {
    handsontable({
      data: createSpreadsheetData(50, 3),
      width: 200,
      height: 200,
      viewportRowRenderingOffset: 0,
      mergeCells: true,
    });

    getPlugin('mergeCells').merge(0, 0, 20, 0);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
    expect(`
      | # :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 28, col: 0 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A30');
    expect(`
      | # :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 29, col: 0 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('A22');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A31');
    expect(`
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('main')('should display properly high merged cell', async() => {
    handsontable({
      data: createSpreadsheetData(50, 3),
      width: 200,
      height: 245,
      viewportRowRenderingOffset: 0,
      mergeCells: true,
    });

    getPlugin('mergeCells').merge(0, 0, 20, 0);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
    expect(`
      | # :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 28, col: 0 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A30');
    expect(`
      | # :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 29, col: 0 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('A22');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A31');
    expect(`
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('horizon')('should display properly high merged cell', async() => {
    handsontable({
      data: createSpreadsheetData(50, 3),
      width: 200,
      height: 313,
      viewportRowRenderingOffset: 0,
      mergeCells: true,
    });

    getPlugin('mergeCells').merge(0, 0, 20, 0);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
    expect(`
      | # :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 28, col: 0 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A30');
    expect(`
      | # :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 29, col: 0 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('A22');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A31');
    expect(`
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
      |   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('classic')('should display properly high virtualized merged cell', async() => {
    handsontable({
      data: createSpreadsheetData(50, 30),
      width: 200,
      height: 200,
      viewportRowRenderingOffset: 0,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 20, 0);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
    expect(`
      | # :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 27, col: 0 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
    expect(`
      | # :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 28, col: 0 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('A22');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A30');
    expect(`
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('main')('should display properly high virtualized merged cell', async() => {
    handsontable({
      data: createSpreadsheetData(50, 30),
      width: 200,
      height: 248,
      viewportRowRenderingOffset: 0,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 20, 0);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
    expect(`
      | # :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 27, col: 0 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
    expect(`
      | # :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 28, col: 0 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('A22');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A30');
    expect(`
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('horizon')('should display properly high virtualized merged cell', async() => {
    handsontable({
      data: createSpreadsheetData(50, 30),
      width: 200,
      height: 312,
      viewportRowRenderingOffset: 0,
      mergeCells: {
        virtualized: true,
      },
    });

    getPlugin('mergeCells').merge(0, 0, 20, 0);

    await selectCell(0, 0);

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
    expect(`
      | # :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 27, col: 0 }); // the merged cell is partially visible

    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
    expect(`
      | # :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    await scrollViewportTo({ row: 28, col: 0 }); // the merged cell is not visible (out of the viewport)

    expect(getHtCore().find('tr:first td:first').text()).toBe('A22');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A30');
    expect(`
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });
});
