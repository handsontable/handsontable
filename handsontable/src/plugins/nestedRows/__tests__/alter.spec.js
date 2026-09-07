describe('NestedRows', () => {
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

  describe('should work properly when some alters have been performed', () => {
    it('inserting and removing rows', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        rowHeaders: true
      });

      const dataAtStart = getData();

      await alter('insert_row_above', 0, 2);

      expect(getData()).toEqual([[null, null, null, null], [null, null, null, null], ...dataAtStart]);

      await alter('remove_row', 0, 2);

      expect(getData()).toEqual(dataAtStart);

      await alter('insert_row_above', 0, 2);

      expect(getData()).toEqual([[null, null, null, null], [null, null, null, null], ...dataAtStart]);
    });

    describe('inserting rows and changing cell values ', () => {
      it('(by API)', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          rowHeaders: true
        });

        const dataAtStart = getData();

        await alter('insert_row_above', 0, 1);

        await setDataAtCell(0, 0, 'value');

        await alter('insert_row_above', 0, 1);

        expect(getData()).toEqual([[null, null, null, null], ['value', null, null, null], ...dataAtStart]);
      });

      it('(using context menu)', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          rowHeaders: true,
          contextMenu: true
        });

        const dataAtStart = getData();

        await selectCell(0, 0);
        await contextMenu();

        $('.htContextMenu .ht_master .htCore')
          .find('tbody td')
          .not('.htSeparator')
          .eq(2) // Insert row above
          .simulate('mousedown')
          .simulate('mouseup');

        await setDataAtCell(0, 0, 'value');

        await selectCell(0, 0);
        await contextMenu();

        $('.htContextMenu .ht_master .htCore')
          .find('tbody td')
          .not('.htSeparator')
          .eq(2) // Insert row above
          .simulate('mousedown')
          .simulate('mouseup');

        expect(getData()).toEqual([[null, null, null, null], ['value', null, null, null], ...dataAtStart]);
      });
    });

    it('inserting rows after calling the `updateSettings` method and changing a cell value', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        rowHeaders: true
      });

      await updateSettings({});

      await setDataAtCell(0, 0, 'value');

      const dataAtStart = getData();

      await alter('insert_row_above', 0, 1);

      expect(getData()).toEqual([[null, null, null, null], ...dataAtStart]);
    });

    it('inserting rows after moving some row and changing a cell value', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        rowHeaders: true,
        manualRowMove: true,
      });

      getPlugin('manualRowMove').dragRows([3], 5);

      await setDataAtCell(0, 0, 'value');

      const dataAtStart = getData();

      await alter('insert_row_above', 0, 1);

      expect(getData()).toEqual([[null, null, null, null], ...dataAtStart]);
    });
  });

  // Repro for https://github.com/handsontable/handsontable/issues/7727
  describe('cell meta shifting when a row is inserted (#7727)', () => {
    /**
     * Inserts a row through the context menu, the way the issue reporter did.
     *
     * @param {number} row Visual row index to open the context menu on.
     * @param {string} optionName Label of the context menu item to click.
     */
    async function insertRowViaContextMenu(row, optionName) {
      await selectCell(row, 0);
      await contextMenu();
      await selectContextMenuOption(optionName);
    }

    /**
     * Marks one cell above the insertion point and one below it, so an assertion can tell a correct
     * shift from a shift at the wrong index. Splicing the meta too high moves the row above too.
     *
     * @param {number} aboveRow Visual row above the insertion point.
     * @param {number} belowRow Visual row below the insertion point.
     * @param {number} column Visual column to mark.
     * @returns {object} The values held by both marked cells before the insert.
     */
    async function markCells(aboveRow, belowRow, column) {
      await setCellMeta(aboveRow, column, 'className', 'above-cell');
      await setCellMeta(belowRow, column, 'className', 'below-cell');
      await setCellMeta(belowRow, column, 'comment', { value: 'below-comment' });

      return {
        aboveValue: getDataAtCell(aboveRow, column),
        belowValue: getDataAtCell(belowRow, column),
      };
    }

    it('nestedRows ON, context menu "Insert row below" (the exact issue repro)', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        comments: true,
        contextMenu: true,
        rowHeaders: true,
      });

      // Rows 1-5 are the children of the first parent. Insert below row 2.
      const { aboveValue, belowValue } = await markCells(1, 3, 2);

      await insertRowViaContextMenu(2, 'Insert row below');

      // The row above the insertion point must not move, and neither must its meta.
      expect(getDataAtCell(1, 2)).toBe(aboveValue);
      expect(getCellMeta(1, 2).className).toBe('above-cell');

      // The row below moved down by one, so its meta must follow.
      expect(getDataAtCell(4, 2)).toBe(belowValue);
      expect(getCellMeta(4, 2).className).toBe('below-cell');
      expect(getCellMeta(4, 2).comment).toEqual({ value: 'below-comment' });
      expect(getCellMeta(3, 2).className).toBeUndefined();
      expect(getCellMeta(3, 2).comment).toBeUndefined();
    });

    it('nestedRows ON, context menu "Insert row above"', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        comments: true,
        contextMenu: true,
        rowHeaders: true,
      });

      const { aboveValue, belowValue } = await markCells(1, 3, 2);

      await insertRowViaContextMenu(3, 'Insert row above');

      expect(getDataAtCell(1, 2)).toBe(aboveValue);
      expect(getCellMeta(1, 2).className).toBe('above-cell');

      expect(getDataAtCell(4, 2)).toBe(belowValue);
      expect(getCellMeta(4, 2).className).toBe('below-cell');
      expect(getCellMeta(4, 2).comment).toEqual({ value: 'below-comment' });
      expect(getCellMeta(3, 2).className).toBeUndefined();
    });

    it('nestedRows ON, context menu "Insert child row"', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        comments: true,
        contextMenu: true,
        rowHeaders: true,
      });

      // "Insert child row" on the first parent appends a child at row 6, so rows 1-5 stay put.
      const { aboveValue, belowValue } = await markCells(3, 7, 2);

      await insertRowViaContextMenu(0, 'Insert child row');

      expect(getDataAtCell(3, 2)).toBe(aboveValue);
      expect(getCellMeta(3, 2).className).toBe('above-cell');

      expect(getDataAtCell(8, 2)).toBe(belowValue);
      expect(getCellMeta(8, 2).className).toBe('below-cell');
      expect(getCellMeta(8, 2).comment).toEqual({ value: 'below-comment' });
      expect(getCellMeta(7, 2).className).toBeUndefined();
    });

    it('nestedRows ON, sibling with descendants sits between the row and the insertion point', async() => {
      handsontable({
        data: getMoreComplexNestedData(),
        nestedRows: true,
        comments: true,
        contextMenu: true,
        rowHeaders: true,
      });

      // Flattened: 0 a0, 1 a0-a0, 2 a0-a1, 3 a0-a2, 4 a0-a2-a0, 5 a0-a2-a0-a0, 6 a0-a3.
      // `a0-a2` is the third child of `a0` but owns rows 3-5, so a sibling inserted below it lands
      // at row 6 - not at `parentIndex + indexWithinParent + 1`, which would be row 4.
      const { aboveValue, belowValue } = await markCells(4, 6, 0);

      await insertRowViaContextMenu(3, 'Insert row below');

      // Rows 4 and 5 are inside `a0-a2`'s own subtree, so they must not move.
      expect(getDataAtCell(4, 0)).toBe(aboveValue);
      expect(getCellMeta(4, 0).className).toBe('above-cell');

      expect(getDataAtCell(7, 0)).toBe(belowValue);
      expect(getCellMeta(7, 0).className).toBe('below-cell');
      expect(getCellMeta(7, 0).comment).toEqual({ value: 'below-comment' });
      expect(getCellMeta(6, 0).className).toBeUndefined();
    });

    it('nestedRows ON, another plugin trims a row above the insertion point', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        comments: true,
        contextMenu: true,
        rowHeaders: true,
        // The nestedRows stash only untrims its own collapsed rows, so this row stays trimmed and
        // visual indexes no longer match physical ones.
        trimRows: [1],
      });

      // Physical rows 1-5 are the first parent's children; with physical 1 trimmed, the visual rows
      // are 0 a0, 1 physical 2, 2 physical 3, 3 physical 4, 4 physical 5.
      const { aboveValue, belowValue } = await markCells(1, 3, 2);

      await insertRowViaContextMenu(2, 'Insert row below');

      expect(getDataAtCell(1, 2)).toBe(aboveValue);
      expect(getCellMeta(1, 2).className).toBe('above-cell');

      expect(getDataAtCell(4, 2)).toBe(belowValue);
      expect(getCellMeta(4, 2).className).toBe('below-cell');
      expect(getCellMeta(3, 2).className).toBeUndefined();
    });

    // A top-level row does not sit in the grid at the position it holds in the top-level array:
    // every preceding parent's subtree sits between the two. So the insertion point is a flattened
    // row index, not a top-level one (DEV-2625).
    describe('next to a top-level row', () => {
      it('shifts the cell meta past the whole subtree of the row the menu was opened on', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          comments: true,
          contextMenu: true,
          rowHeaders: true,
        });

        // Top-level parents sit at rows 0, 6 and 12, with five leaf children each. "Insert row
        // below" on row 6 puts the new row after that parent's whole subtree, so at row 12 - not at
        // row 2, which is where row 6 sits in the three-element top-level array.
        const { aboveValue } = await markCells(11, 12, 2);

        await insertRowViaContextMenu(6, 'Insert row below');

        // Row 11 is the last child of the parent the menu was opened on, so it does not move.
        expect(getDataAtCell(11, 2)).toBe(aboveValue);
        expect(getCellMeta(11, 2).className).toBe('above-cell');

        // The third top-level parent moved from row 12 to row 13, so its meta must follow.
        expect(getDataAtCell(13, 0)).toBe('Best Rock Song');
        expect(getCellMeta(13, 2).className).toBe('below-cell');
        expect(getCellMeta(13, 2).comment).toEqual({ value: 'below-comment' });
        expect(getCellMeta(12, 2).className).toBeUndefined();
        expect(getCellMeta(12, 2).comment).toBeUndefined();
      });

      it('leaves the meta of a row above the insertion point where it was', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          contextMenu: true,
          rowHeaders: true,
        });

        // The case from the report: row 3 is the third child of the first parent, and the new row
        // lands nine rows below it.
        await setCellMeta(3, 2, 'className', 'reported-cell');

        await insertRowViaContextMenu(6, 'Insert row below');

        expect(getCellMeta(3, 2).className).toBe('reported-cell');
        expect(getCellMeta(4, 2).className).toBeUndefined();
      });

      it('shifts the row index maps past the whole subtree as well', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          contextMenu: true,
          rowHeaders: true,
          // A hidden row keeps its visual index, so hiding one renumbers nothing. Row 3 sits between
          // the top-level position of row 6 (2) and its real insertion point (12), which is the only
          // place where the two can be told apart. Row 13 sits below the insertion point, so it has
          // to move - without it the spec would also pass if the maps were never shifted at all.
          hiddenRows: { rows: [3, 13] },
        });

        await insertRowViaContextMenu(6, 'Insert row below');

        // Above the insertion point: stays put.
        expect(getPlugin('hiddenRows').isHidden(3)).toBe(true);
        expect(getPlugin('hiddenRows').isHidden(4)).toBe(false);

        // Below it: moves down by one, along with the row it belongs to.
        expect(getPlugin('hiddenRows').isHidden(14)).toBe(true);
        expect(getPlugin('hiddenRows').isHidden(13)).toBe(false);
      });

      it('inserts the new row into the top-level array', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          contextMenu: true,
          rowHeaders: true,
        });

        await insertRowViaContextMenu(6, 'Insert row below');

        const topLevelRows = getPlugin('nestedRows').dataManager.getData();

        expect(topLevelRows.length).toBe(4);
        expect(topLevelRows[2]).toEqual({
          artist: null,
          category: null,
          label: null,
          title: null,
          __children: null,
        });
        expect(topLevelRows[3].category).toBe('Best Rock Song');
        expect(countRows()).toBe(19);

        // The branch splices the data manager's own array, which is only correct while that is the
        // core's source array too. Read it back the way the core sees it.
        expect(getPlugin('nestedRows').dataManager.getRawSourceData().length).toBe(4);
      });

      it('keeps a collapsed parent collapsed', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          contextMenu: true,
          rowHeaders: true,
        });

        // Collapsing the first parent trims physical rows 1-5, which sit between the top-level
        // position of the second parent (2) and the row the new one really takes (12). The insert
        // runs while the collapsed-rows stash holds the grid expanded, so the stash has to come back
        // onto the same rows afterwards.
        getPlugin('nestedRows').collapseParent(0);

        await insertRowViaContextMenu(1, 'Insert row below');

        expect(getPlugin('nestedRows').isParentCollapsed(0)).toBe(true);
        expect(countRows()).toBe(14);

        // Visual rows: 0 the collapsed parent, 1 the second parent, 2-6 its children, 7 the new row.
        expect(getDataAtCell(0, 0)).toBe('Best Rock Performance');
        expect(getDataAtCell(1, 0)).toBe('Best Metal Performance');
        expect(getDataAtCell(6, 2)).toBe('Custer');
        expect(getDataAtCell(7, 2)).toBe(null);
        expect(getDataAtCell(8, 0)).toBe('Best Rock Song');
      });

      it('cancels the insert when a `beforeCreateRow` listener returns `false`', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          contextMenu: true,
          rowHeaders: true,
          // What the `formulas` plugin answers whenever HyperFormula cannot extend the sheet. Its
          // own `afterCreateRow` listener calls `engine.addRows()` regardless of the source, so an
          // insert that runs anyway desyncs the engine from the grid.
          beforeCreateRow: () => false,
        });

        // Collapsed, so the assertion below can tell whether `afterAddChild` ran: it is the hook
        // that closes the collapsed-rows stash, and a cancel that skips it leaves the grid expanded
        // for the rest of its life.
        getPlugin('nestedRows').collapseParent(0);

        expect(countRows()).toBe(13);

        await insertRowViaContextMenu(1, 'Insert row below');

        expect(getPlugin('nestedRows').dataManager.getData().length).toBe(3);
        expect(getPlugin('nestedRows').isParentCollapsed(0)).toBe(true);
        expect(countRows()).toBe(13);
      });

      it('undoes the insert by removing the row it added', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          contextMenu: true,
          rowHeaders: true,
        });

        const dataAtStart = getData();

        await insertRowViaContextMenu(6, 'Insert row below');

        expect(countRows()).toBe(19);

        // `UndoRedo` records the index `afterCreateRow` reports and removes that row again, so a
        // top-level position here used to delete a child of the *first* parent instead.
        getPlugin('undoRedo').undo();

        expect(countRows()).toBe(18);
        expect(getPlugin('nestedRows').dataManager.getData().length).toBe(3);
        expect(getData()).toEqual(dataAtStart);
      });

      it('shifts the cell meta when inserting above a top-level row', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          comments: true,
          contextMenu: true,
          rowHeaders: true,
        });

        // "Insert row above" on the third parent lands on the same row as "Insert row below" on the
        // second one, but it reaches `addChildAtIndex()` through the other branch of `addSibling()`.
        const { aboveValue } = await markCells(11, 12, 2);

        await insertRowViaContextMenu(12, 'Insert row above');

        expect(getDataAtCell(11, 2)).toBe(aboveValue);
        expect(getCellMeta(11, 2).className).toBe('above-cell');

        expect(getDataAtCell(13, 0)).toBe('Best Rock Song');
        expect(getCellMeta(13, 2).className).toBe('below-cell');
        expect(getCellMeta(12, 2).className).toBeUndefined();
      });

      it('moves no meta at all when the new row is appended past the last one', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          comments: true,
          contextMenu: true,
          rowHeaders: true,
        });

        // "Insert row below" on the last top-level parent appends after its subtree, at row 18. No
        // existing row moves, so no meta may move either.
        const { aboveValue, belowValue } = await markCells(11, 17, 2);

        await insertRowViaContextMenu(12, 'Insert row below');

        expect(getDataAtCell(11, 2)).toBe(aboveValue);
        expect(getCellMeta(11, 2).className).toBe('above-cell');

        expect(getDataAtCell(17, 2)).toBe(belowValue);
        expect(getCellMeta(17, 2).className).toBe('below-cell');
        expect(getCellMeta(17, 2).comment).toEqual({ value: 'below-comment' });
        expect(getCellMeta(18, 2).className).toBeUndefined();
        expect(countRows()).toBe(19);
      });

      it('leaves the selection on the row the menu was opened on', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          contextMenu: true,
          rowHeaders: true,
        });

        // Opening the menu selects row 6, and the new row lands below it at row 12, so row 6 keeps
        // both its data and its selection.
        await insertRowViaContextMenu(6, 'Insert row below');

        expect(getSelectedLast()).toEqual([6, 0, 6, 0]);
        expect(getDataAtCell(6, 0)).toBe('Best Metal Performance');
      });

      it('moves the selection down when the new row takes the selected row\'s place', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          contextMenu: true,
          rowHeaders: true,
        });

        // "Insert row above" puts the new row at row 12, so the selected row itself moves to 13.
        await insertRowViaContextMenu(12, 'Insert row above');

        expect(getSelectedLast()).toEqual([13, 0, 13, 0]);
        expect(getDataAtCell(13, 0)).toBe('Best Rock Song');
      });

      it('shifts the cell meta when another plugin trims a row above the insertion point', async() => {
        handsontable({
          data: getSimplerNestedData(),
          nestedRows: true,
          comments: true,
          contextMenu: true,
          rowHeaders: true,
          // The nestedRows stash only untrims its own collapsed rows, so this row stays trimmed and
          // visual indexes no longer match physical ones.
          trimRows: [1],
        });

        // With physical row 1 trimmed, the second parent sits at visual row 5 and the third at 11.
        const { aboveValue } = await markCells(10, 11, 2);

        await insertRowViaContextMenu(5, 'Insert row below');

        expect(getDataAtCell(10, 2)).toBe(aboveValue);
        expect(getCellMeta(10, 2).className).toBe('above-cell');

        expect(getDataAtCell(12, 0)).toBe('Best Rock Song');
        expect(getCellMeta(12, 2).className).toBe('below-cell');
        expect(getCellMeta(11, 2).className).toBeUndefined();
      });
    });

    // Control: this path goes through `DataMap#createRow`, which always shifted the meta. It guards
    // against the fix breaking the API path, not against the bug itself.
    it('control: nestedRows ON, `alter("insert_row_below")` API', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        comments: true,
        rowHeaders: true,
      });

      const { aboveValue, belowValue } = await markCells(1, 3, 2);

      await alter('insert_row_below', 2, 1);

      expect(getDataAtCell(1, 2)).toBe(aboveValue);
      expect(getCellMeta(1, 2).className).toBe('above-cell');

      expect(getDataAtCell(4, 2)).toBe(belowValue);
      expect(getCellMeta(4, 2).className).toBe('below-cell');
      expect(getCellMeta(3, 2).className).toBeUndefined();
    });

    // Control: the same menu item without the plugin, proving the shift is the plugin's job.
    it('control: nestedRows OFF, context menu "Insert row below"', async() => {
      handsontable({
        data: createSpreadsheetData(10, 4),
        comments: true,
        contextMenu: true,
        rowHeaders: true,
      });

      const { aboveValue, belowValue } = await markCells(1, 3, 2);

      await insertRowViaContextMenu(2, 'Insert row below');

      expect(getDataAtCell(1, 2)).toBe(aboveValue);
      expect(getCellMeta(1, 2).className).toBe('above-cell');

      expect(getDataAtCell(4, 2)).toBe(belowValue);
      expect(getCellMeta(4, 2).className).toBe('below-cell');
      expect(getCellMeta(3, 2).className).toBeUndefined();
    });
  });
});
