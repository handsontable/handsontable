describe('HiddenRows', () => {
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

  describe('public API', () => {
    describe('hideRow()', () => {
      it('should hide row by passing the visual row index', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 3),
          hiddenRows: true,
        });

        expect(getCell(1, 0).innerText).toBe('A2');

        getPlugin('hiddenRows').hideRow(1);
        render();

        expect(getCell(1, 0)).toBe(null);
      });
    });

    describe('showRow()', () => {
      it('should show row by passing the visual row index', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 3),
          hiddenRows: {
            rows: [1],
          },
        });

        expect(getCell(1, 0)).toBe(null);

        getPlugin('hiddenRows').showRow(1);
        render();

        expect(getCell(1, 0).innerText).toBe('A2');
      });
    });

    describe('isHidden()', () => {
      it('should return `true` for hidden row', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 3),
          hiddenRows: {
            rows: [1],
          },
        });

        const plugin = getPlugin('hiddenRows');

        expect(plugin.isHidden(0)).toBe(false);
        expect(plugin.isHidden(1)).toBe(true);
        expect(plugin.isHidden(2)).toBe(false);

        getPlugin('hiddenRows').showRow(1);
        render();

        expect(plugin.isHidden(0)).toBe(false);
        expect(plugin.isHidden(1)).toBe(false);
        expect(plugin.isHidden(2)).toBe(false);

        getPlugin('hiddenRows').hideRow(2);
        render();

        expect(plugin.isHidden(0)).toBe(false);
        expect(plugin.isHidden(1)).toBe(false);
        expect(plugin.isHidden(2)).toBe(true);
      });
    });

    describe('getHiddenRows()', () => {
      it('should return collection of hidden visual row indexes', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(3, 3),
          hiddenRows: {
            rows: [1],
          },
        });

        const plugin = getPlugin('hiddenRows');

        expect(plugin.getHiddenRows()).toEqual([1]);

        getPlugin('hiddenRows').showRow(1);
        render();

        expect(plugin.getHiddenRows()).toEqual([]);

        getPlugin('hiddenRows').hideRows([0, 2]);
        render();

        expect(plugin.getHiddenRows()).toEqual([0, 2]);
      });

      it('should return correct visual indexes when some rows are sorted ' +
         '(force desync between physical and visual indexes)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 1),
          rowHeaders: true,
          hiddenRows: {
            rows: [1],
            indicators: true,
          },
          columnSorting: {
            initialConfig: {
              column: 0,
              sortOrder: 'asc'
            }
          },
        });

        const plugin = getPlugin('hiddenRows');

        expect(plugin.getHiddenRows()).toEqual([2]);

        getPlugin('hiddenRows').showRow(2);
        render();

        expect(plugin.getHiddenRows()).toEqual([]);

        getPlugin('hiddenRows').hideRows([3, 6]);
        render();

        expect(plugin.getHiddenRows()).toEqual([3, 6]);
      });
    });
  });
});
