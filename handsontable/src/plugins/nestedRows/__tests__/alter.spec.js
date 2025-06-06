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
});
