describe('settings', () => {
  describe('minSpareRows', () => {
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

    it('should create a new row after ENTER hit', async() => {
      handsontable({
        data: createSpreadsheetData(5, 2),
        minSpareRows: 1,
      });

      await selectCell(5, 0);
      await keyDownUp('enter');

      getActiveEditor().TEXTAREA.value = 'test';

      await keyDownUp('enter');

      expect(countRows()).toBe(7);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 6,0 from: 6,0 to: 6,0']);
    });

    it('should create a spare row after removing all rows', async() => {
      handsontable({
        data: createSpreadsheetData(4, 1),
        rowHeaders: true,
        colHeaders: true,
        minSpareRows: 1,
      });

      await alter('remove_row', 0, 5);

      expect(countRows()).toBe(1);
      expect(getCell(0, -1)).toBeInstanceOf(HTMLTableCellElement);
    });

    describe('works on init', () => {
      it('should show data properly when `minSpareRows` is set to 3', async() => {
        handsontable({
          data: createSpreadsheetData(1, 1),
          minSpareRows: 3
        });

        expect(getSourceDataAtCol(0).length).toEqual(4);
        expect(countSourceRows()).toEqual(4);
        expect(countRows()).toEqual(4);
        expect(getData().length).toEqual(4);
        expect(countEmptyRows()).toEqual(3);
      });
    });

    describe('update settings works', () => {
      it('should show data properly after `minSpareRows` is updated to 3', async() => {
        handsontable({
          data: createSpreadsheetData(1, 1)
        });

        await updateSettings({
          minSpareRows: 3
        });

        expect(getSourceDataAtCol(0).length).toEqual(4);
        expect(countSourceRows()).toEqual(4);
        expect(countRows()).toEqual(4);
        expect(getData().length).toEqual(4);
        expect(countEmptyRows()).toEqual(3);
      });

      // Currently this is a bug (#6571)
      xit('should show data properly after `minSpareRows` is updated from 5 to 3', async() => {
        handsontable({
          data: createSpreadsheetData(1, 1),
          minSpareRows: 5
        });

        await updateSettings({
          minSpareRows: 3
        });

        expect(getSourceDataAtCol(0).length).toEqual(4);
        expect(countSourceRows()).toEqual(4);
        expect(countRows()).toEqual(4);
        expect(getData().length).toEqual(4);
        expect(countEmptyRows()).toEqual(3);
      });
    });

    describe('with dataSchema having non-null default values', () => {
      it('should not add extra rows when the spare row already contains the dataSchema defaults (GH #671, GH #2409)', async() => {
        handsontable({
          data: [{ active: false }],
          dataSchema: { active: false },
          columns: [{ data: 'active', type: 'checkbox' }],
          minSpareRows: 1,
        });

        // 1 data row + 1 spare row
        expect(countRows()).toBe(2);

        // Changing a value should not trigger an extra row being appended
        await setDataAtCell(0, 0, true);

        expect(countRows()).toBe(2);
      });

      it('should count spare rows correctly when all cells match the dataSchema defaults (GH #671)', async() => {
        handsontable({
          data: [{ active: false }, { active: false }],
          dataSchema: { active: false },
          columns: [{ data: 'active', type: 'checkbox' }],
          minSpareRows: 1,
        });

        // Both rows have only schema-default values - they are all "empty"
        // minSpareRows: 1 is already satisfied at initialization (row 1 is spare)
        expect(countEmptyRows()).toBe(2);
        expect(countRows()).toBe(2);
      });

      it('should add a spare row when a value is changed to differ from the dataSchema default (GH #671)', async() => {
        handsontable({
          data: [{ active: false }],
          dataSchema: { active: false },
          columns: [{ data: 'active', type: 'checkbox' }],
          minSpareRows: 1,
        });

        expect(countRows()).toBe(2);

        // Row 0 now differs from schema default — row 1 becomes the only spare row
        // Changing row 1 should trigger a new spare row
        await setDataAtCell(1, 0, true);

        expect(countRows()).toBe(3);
      });

      it('should work with numeric dataSchema default values (GH #671)', async() => {
        handsontable({
          data: [{ value: 0 }],
          dataSchema: { value: 0 },
          columns: [{ data: 'value' }],
          minSpareRows: 1,
        });

        expect(countRows()).toBe(2);

        await setDataAtCell(0, 0, 42);

        expect(countRows()).toBe(2);
      });
    });

    describe('cell meta', () => {
      it('should be rendered as is without shifting the cell meta objects', async() => {
        handsontable({
          data: createSpreadsheetData(1, 1),
          minSpareRows: 3,
        });

        getCellMeta(4, 0).test = 'foo';
        getCellMeta(5, 0).test = 'bar';

        await updateSettings({
          minSpareRows: 5
        });

        expect(getCellMeta(0, 0).test).toBeUndefined();
        expect(getCellMeta(1, 0).test).toBeUndefined();
        expect(getCellMeta(2, 0).test).toBeUndefined();
        expect(getCellMeta(3, 0).test).toBeUndefined();
        expect(getCellMeta(4, 0).test).toBe('foo');
        expect(getCellMeta(5, 0).test).toBe('bar');
        expect(getCellMeta(6, 0).test).toBeUndefined();
      });
    });
  });
});
