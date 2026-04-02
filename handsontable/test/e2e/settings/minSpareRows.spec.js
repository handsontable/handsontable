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

    describe('with dataSchema', () => {
      it('should not add infinite rows when dataSchema has non-null default values (checkbox column)', async() => {
        handsontable({
          data: [{ active: false, name: 'Alice' }],
          dataSchema: { active: false, name: null },
          columns: [
            { data: 'active', type: 'checkbox' },
            { data: 'name' },
          ],
          minSpareRows: 1,
        });

        expect(countRows()).toBe(2);

        await setDataAtRowProp(0, 'active', true);

        expect(countRows()).toBe(2);
      });

      it('should add a spare row when dataSchema has non-null default values and all rows are non-empty', async() => {
        handsontable({
          data: [{ active: true, name: 'Alice' }],
          dataSchema: { active: false, name: null },
          columns: [
            { data: 'active', type: 'checkbox' },
            { data: 'name' },
          ],
          minSpareRows: 1,
        });

        expect(countRows()).toBe(2);
        expect(countEmptyRows()).toBe(1);
      });

      it('should maintain correct spare rows count when dataSchema default is false for boolean column', async() => {
        handsontable({
          data: [],
          dataSchema: { active: false, name: null },
          columns: [
            { data: 'active', type: 'checkbox' },
            { data: 'name' },
          ],
          minSpareRows: 2,
        });

        expect(countRows()).toBe(2);
        expect(countEmptyRows()).toBe(2);

        await setDataAtRowProp(0, 'name', 'Bob');

        expect(countRows()).toBe(3);
        expect(countEmptyRows()).toBe(2);
      });

      it('should not add infinite rows when dataSchema uses object schema with non-null default values', async() => {
        handsontable({
          data: [{ id: 0, name: null }],
          dataSchema: { id: 0, name: null },
          columns: [
            { data: 'id' },
            { data: 'name' },
          ],
          minSpareRows: 1,
        });

        expect(countRows()).toBe(2);

        await setDataAtRowProp(0, 'id', 1);

        expect(countRows()).toBe(2);
      });
    });
  });
});
