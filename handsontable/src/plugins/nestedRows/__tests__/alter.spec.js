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
     * @param {number} itemIndex Index of the non-separator context menu item to click.
     */
    async function insertRowViaContextMenu(row, itemIndex) {
      await selectCell(row, 0);
      await contextMenu();

      $('.htContextMenu .ht_master .htCore')
        .find('tbody td')
        .not('.htSeparator')
        .eq(itemIndex)
        .simulate('mousedown')
        .simulate('mouseup');
    }

    it('nestedRows ON, context menu "Insert row below" (the exact issue repro)', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        comments: true,
        contextMenu: true,
        rowHeaders: true,
      });

      await setCellMeta(3, 2, 'className', 'marked-cell');
      await setCellMeta(3, 2, 'comment', { value: 'marked-comment' });

      const markedValueBefore = getDataAtCell(3, 2);

      // Non-separator items with nestedRows: 0=add_child, 1=detach_from_parent, 2=row_above, 3=row_below.
      await insertRowViaContextMenu(1, 3);

      // Sanity: the marked row really moved from visual 3 to visual 4.
      expect(getDataAtCell(4, 2)).toBe(markedValueBefore);

      // The meta must have followed the row.
      expect(getCellMeta(4, 2).className).toBe('marked-cell');
      expect(getCellMeta(4, 2).comment).toEqual({ value: 'marked-comment' });
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

      await setCellMeta(3, 2, 'className', 'marked-cell');
      await setCellMeta(3, 2, 'comment', { value: 'marked-comment' });

      const markedValueBefore = getDataAtCell(3, 2);

      await insertRowViaContextMenu(3, 2);

      expect(getDataAtCell(4, 2)).toBe(markedValueBefore);
      expect(getCellMeta(4, 2).className).toBe('marked-cell');
      expect(getCellMeta(4, 2).comment).toEqual({ value: 'marked-comment' });
      expect(getCellMeta(3, 2).className).toBeUndefined();
      expect(getCellMeta(3, 2).comment).toBeUndefined();
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

      await setCellMeta(3, 2, 'className', 'marked-cell');
      await setCellMeta(3, 2, 'comment', { value: 'marked-comment' });

      const markedValueBefore = getDataAtCell(3, 2);

      await alter('insert_row_below', 1, 1);

      expect(getDataAtCell(4, 2)).toBe(markedValueBefore);
      expect(getCellMeta(4, 2).className).toBe('marked-cell');
      expect(getCellMeta(4, 2).comment).toEqual({ value: 'marked-comment' });
      expect(getCellMeta(3, 2).className).toBeUndefined();
      expect(getCellMeta(3, 2).comment).toBeUndefined();
    });

    it('nestedRows ON, context menu "Insert child row"', async() => {
      handsontable({
        data: getSimplerNestedData(),
        nestedRows: true,
        comments: true,
        contextMenu: true,
        rowHeaders: true,
      });

      // Parents hold no `title`, so mark row 7 - the first child of the second parent.
      await setCellMeta(7, 2, 'className', 'marked-cell');
      await setCellMeta(7, 2, 'comment', { value: 'marked-comment' });

      const markedValueBefore = getDataAtCell(7, 2);

      // "Insert child row" appends a child to the first parent, so everything below shifts by one.
      await insertRowViaContextMenu(0, 0);

      expect(getDataAtCell(8, 2)).toBe(markedValueBefore);
      expect(getCellMeta(8, 2).className).toBe('marked-cell');
      expect(getCellMeta(8, 2).comment).toEqual({ value: 'marked-comment' });
      expect(getCellMeta(7, 2).className).toBeUndefined();
      expect(getCellMeta(7, 2).comment).toBeUndefined();
    });

    it('control: nestedRows OFF, context menu "Insert row below"', async() => {
      handsontable({
        data: createSpreadsheetData(10, 4),
        comments: true,
        contextMenu: true,
        rowHeaders: true,
      });

      await setCellMeta(3, 2, 'className', 'marked-cell');
      await setCellMeta(3, 2, 'comment', { value: 'marked-comment' });

      const markedValueBefore = getDataAtCell(3, 2);

      // Non-separator items without nestedRows: 0=row_above, 1=row_below.
      await insertRowViaContextMenu(1, 1);

      expect(getDataAtCell(4, 2)).toBe(markedValueBefore);
      expect(getCellMeta(4, 2).className).toBe('marked-cell');
      expect(getCellMeta(4, 2).comment).toEqual({ value: 'marked-comment' });
      expect(getCellMeta(3, 2).className).toBeUndefined();
      expect(getCellMeta(3, 2).comment).toBeUndefined();
    });
  });
});
