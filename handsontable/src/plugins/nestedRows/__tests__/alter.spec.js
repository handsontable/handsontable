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
