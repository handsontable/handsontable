describe('HiddenColumns', () => {
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
    describe('hideColumn()', () => {
      it('should hide column by passing the visual column index', async() => {
        handsontable({
          data: createSpreadsheetData(1, 3),
          hiddenColumns: true,
        });

        expect(getCell(0, 1).innerText).toBe('B1');

        getPlugin('hiddenColumns').hideColumn(1);
        await render();

        expect(getCell(0, 1)).toBe(null);
      });
    });

    describe('showColumn()', () => {
      it('should show column by passing the visual column index', async() => {
        handsontable({
          data: createSpreadsheetData(1, 3),
          hiddenColumns: {
            columns: [1],
          },
        });

        expect(getCell(0, 1)).toBe(null);

        getPlugin('hiddenColumns').showColumn(1);
        await render();

        expect(getCell(0, 1).innerText).toBe('B1');
      });
    });

    describe('showColumns', () => {
      it('should update the table width, when calling `showColumns` after running `hideColumns` beforehand', async() => {
        handsontable({
          data: createSpreadsheetData(5, 7),
          colHeaders: true,
          rowHeaders: true,
          hiddenColumns: {
            columns: [],
          },
        });

        const initialHiderWidth = $(hot().view._wt.wtTable.hider).width();

        getPlugin('hiddenColumns').hideColumns([2, 3, 4, 5]);
        await render();
        getPlugin('hiddenColumns').showColumns([2, 3, 4, 5]);
        await render();

        expect($(hot().view._wt.wtTable.hider).width()).toEqual(initialHiderWidth);
      });
    });

    describe('isHidden()', () => {
      it('should return `true` for hidden column', async() => {
        handsontable({
          data: createSpreadsheetData(3, 3),
          hiddenColumns: {
            columns: [1],
          },
        });

        const plugin = getPlugin('hiddenColumns');

        expect(plugin.isHidden(0)).toBe(false);
        expect(plugin.isHidden(1)).toBe(true);
        expect(plugin.isHidden(2)).toBe(false);

        getPlugin('hiddenColumns').showColumn(1);
        await render();

        expect(plugin.isHidden(0)).toBe(false);
        expect(plugin.isHidden(1)).toBe(false);
        expect(plugin.isHidden(2)).toBe(false);

        getPlugin('hiddenColumns').hideColumn(2);
        await render();

        expect(plugin.isHidden(0)).toBe(false);
        expect(plugin.isHidden(1)).toBe(false);
        expect(plugin.isHidden(2)).toBe(true);
      });
    });

    describe('getHiddenColumns()', () => {
      it('should return collection of hidden visual column indexes', async() => {
        handsontable({
          data: createSpreadsheetData(3, 3),
          hiddenColumns: {
            columns: [1],
          },
        });

        const plugin = getPlugin('hiddenColumns');

        expect(plugin.getHiddenColumns()).toEqual([1]);

        getPlugin('hiddenColumns').showColumn(1);
        await render();

        expect(plugin.getHiddenColumns()).toEqual([]);

        getPlugin('hiddenColumns').hideColumns([0, 2]);
        await render();

        expect(plugin.getHiddenColumns()).toEqual([0, 2]);
      });

      it('should return correct visual indexes when columns sequence is non-contiguous ' +
         '(force desync between physical and visual indexes)', async() => {
        handsontable({
          data: createSpreadsheetData(1, 10),
          colHeaders: true,
          hiddenColumns: {
            columns: [1],
            indicators: true,
          },
        });

        columnIndexMapper().setIndexesSequence([0, 9, 1, 2, 3, 4, 5, 6, 7, 8]);

        const plugin = getPlugin('hiddenColumns');

        expect(plugin.getHiddenColumns()).toEqual([2]);

        getPlugin('hiddenColumns').showColumn(2);
        await render();

        expect(plugin.getHiddenColumns()).toEqual([]);

        getPlugin('hiddenColumns').hideColumns([3, 6]);
        await render();

        expect(plugin.getHiddenColumns()).toEqual([3, 6]);
      });
    });

    describe('isValidConfig()', () => {
      it('should return `false` for columns passed as not a number', async() => {
        handsontable({
          data: createSpreadsheetData(3, 3),
          hiddenColumns: true,
        });

        const plugin = getPlugin('hiddenColumns');

        expect(plugin.isValidConfig()).toBe(false);
        expect(plugin.isValidConfig(null)).toBe(false);
        expect(plugin.isValidConfig(undefined)).toBe(false);
        expect(plugin.isValidConfig(1)).toBe(false);
        expect(plugin.isValidConfig({ index: 1 })).toBe(false);
        expect(plugin.isValidConfig([])).toBe(false);
        expect(plugin.isValidConfig([[]])).toBe(false);
        expect(plugin.isValidConfig([null])).toBe(false);
        expect(plugin.isValidConfig([undefined])).toBe(false);
        expect(plugin.isValidConfig(['1'])).toBe(false);
        expect(plugin.isValidConfig([{ index: 1 }])).toBe(false);
      });

      it('should return `true` for columns, which are within the range of the table size', async() => {
        handsontable({
          data: createSpreadsheetData(3, 3),
          hiddenColumns: true,
        });

        const plugin = getPlugin('hiddenColumns');

        expect(plugin.isValidConfig([0])).toBe(true);
        expect(plugin.isValidConfig([1, 2])).toBe(true);
        expect(plugin.isValidConfig([0, 1, 2])).toBe(true);

        expect(plugin.isValidConfig([-1])).toBe(false);
        expect(plugin.isValidConfig([-1, 0])).toBe(false);
        expect(plugin.isValidConfig([0, 1, 2, 3])).toBe(false);
        expect(plugin.isValidConfig([3])).toBe(false);
      });
    });
    describe('clear()', () => {
      it('should clear the data from hidden column when hidden column is second last one', async() => {
        const col = 2;

        handsontable({
          data: createSpreadsheetData(2, col),
          hiddenColumns: {
            columns: [col - 1], // hide penultimate column
          }
        });

        await clear();
        const emptyData = getData();
        const empyDataComparision = [[null, null], [null, null]];

        expect(emptyData).toEqual(empyDataComparision);
      });
    });

    describe('setDataAtCell()', () => {
      it('should correctly render the changed values subjected to validation when there is a hidden column next to it', async() => {
        handsontable({
          data: [[1, 2, 'Smith']],
          hiddenColumns: {
            columns: [0], // hide the first column
          },
          columns: [
            {}, // the first empty column
            { // the second numeric column
              type: 'numeric',
              allowInvalid: false,
            },
            {}, // the last column without validation
          ]
        });

        await setDataAtCell(0, 1, 'aa'); // set such data in the second column so that it does not pass validation

        expect(getDataAtCell(0, 1)).toBe(2);
        expect(getCell(0, 1).textContent).toBe('2');
      });
    });
  });
});
