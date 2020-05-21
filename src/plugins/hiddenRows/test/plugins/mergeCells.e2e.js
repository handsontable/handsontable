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

  describe('MergeCells', () => {
    it('should display properly merged area based on the settings', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
        mergeCells: [
          { row: 0, col: 0, rowspan: 3, colspan: 3 }
        ],
        hiddenRows: {
          rows: [1],
        },
      });

      expect(getData()).toEqual([
        ['A1', null, null, 'D1', 'E1'],
        [null, null, null, 'D2', 'E2'],
        [null, null, null, 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);

      expect(getHtCore().outerHeight()).toBe(93);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([1]);
      render();

      expect(getHtCore().outerHeight()).toBe(116);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(70);

      getPlugin('hiddenRows').hideRows([1]);
      render();

      expect(getHtCore().outerHeight()).toBe(93);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);
    });

    it('should display properly merged area containing hidden rows (start from visible cell, merging to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        rowHeaders: true, // It has to be enabled due the bug in mergeCells plugin (#4907)
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(1, 0, 3, 0);

      // Merged from visual row index 1 (visible) to visual row index 3 (visible).
      //                                 ↓    merged data     ↓
      expect(getData()).toEqual([['A1'], ['A2'], [null], [null], ['A5']]);
      expect(getHtCore().find('td:eq(0)').text()).toBe('A2');
      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([2]);
      render();

      expect(getHtCore().outerHeight()).toBe(70);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(70);

      getPlugin('hiddenRows').hideRows([2]);
      render();

      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([0, 2, 4]);
      render();

      expect(getHtCore().outerHeight()).toBe(116);
      expect(getHtCore().find('td:eq(1)').outerHeight()).toBe(69);
    });

    it('should display properly merged area containing hidden rows (start from invisible cell, merging to visible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        rowHeaders: true, // It has to be enabled due the bug in mergeCells plugin (#4907)
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 0, 3, 0);

      // Merged from visual row index 0 (invisible) to visual row index 3 (visible).
      //                         ↓        merged data         ↓
      expect(getData()).toEqual([['A1'], [null], [null], [null], ['A5']]);

      // TODO: It should show value from the hidden row?
      // expect(getHtCore().find('td:eq(0)').text()).toBe('A1');

      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([0]);
      render();

      expect(getHtCore().outerHeight()).toBe(70);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(70);

      getPlugin('hiddenRows').showRows([2]);
      render();

      expect(getHtCore().outerHeight()).toBe(93);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(93);

      getPlugin('hiddenRows').hideRows([0, 2]);
      render();

      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([0, 2, 4]);
      render();

      expect(getHtCore().outerHeight()).toBe(116);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(93);
    });

    it('should display properly merged area containing hidden rows (start from visible cell, merging to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        rowHeaders: true, // It has to be enabled due the bug in mergeCells plugin (#4907)
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(1, 0, 4, 0);

      // Merged from visual row index 1 (visible) to visual row index 4 (invisible).
      //                                 ↓        merged data         ↓
      expect(getData()).toEqual([['A1'], ['A2'], [null], [null], [null]]);
      expect(getHtCore().find('td:eq(0)').text()).toBe('A2');

      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([2]);
      render();

      expect(getHtCore().outerHeight()).toBe(70);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(70);

      getPlugin('hiddenRows').showRows([4]);
      render();

      expect(getHtCore().outerHeight()).toBe(93);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(93);

      getPlugin('hiddenRows').hideRows([2, 4]);
      render();

      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([0, 2, 4]);
      render();

      expect(getHtCore().outerHeight()).toBe(116);
      expect(getHtCore().find('td:eq(1)').outerHeight()).toBe(92);
    });

    it('should display properly merged area containing hidden rows (start from invisible cell, merging to invisible cell)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        rowHeaders: true, // It has to be enabled due the bug in mergeCells plugin (#4907)
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(0, 0, 4, 0);

      // Merged from visual row index 0 (invisible) to visual row index 4 (invisible).
      //                         ↓           merged data               ↓
      expect(getData()).toEqual([['A1'], [null], [null], [null], [null]]);

      // TODO: It should show value from the hidden row?
      // expect(getHtCore().find('td:eq(0)').text()).toBe('A1');

      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([0]);
      render();

      expect(getHtCore().outerHeight()).toBe(70);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(70);

      getPlugin('hiddenRows').showRows([2]);
      render();

      expect(getHtCore().outerHeight()).toBe(93);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(93);

      getPlugin('hiddenRows').showRows([4]);
      render();

      expect(getHtCore().outerHeight()).toBe(116);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(116);

      getPlugin('hiddenRows').hideRows([0, 2, 4]);
      render();

      expect(getHtCore().outerHeight()).toBe(47);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(47);

      getPlugin('hiddenRows').showRows([0, 2, 4]);
      render();

      expect(getHtCore().outerHeight()).toBe(116);
      expect(getHtCore().find('td:eq(0)').outerHeight()).toBe(116);
    });

    it('should return proper values from the `getCell` function', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        rowHeaders: true, // It has to be enabled due the bug in mergeCells plugin (#4907)
        hiddenRows: {
          rows: [0, 2, 4],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(1, 0, 3, 0);

      expect(getCell(0, 0)).toBe(null);
      expect(getCell(1, 0)).toBe(getHtCore().find('td')[0]);
      expect(getCell(2, 0)).toBe(null);
      expect(getCell(3, 0)).toBe(getHtCore().find('td')[0]);
      expect(getCell(4, 0)).toBe(null);

      getPlugin('hiddenRows').showRows([2]);
      render();

      expect(getCell(0, 0)).toBe(null);
      expect(getCell(1, 0)).toBe(getHtCore().find('td')[0]);
      expect(getCell(2, 0)).toBe(getHtCore().find('td')[0]);
      expect(getCell(3, 0)).toBe(getHtCore().find('td')[0]);
      expect(getCell(4, 0)).toBe(null);
    });

    it('should translate row indexes properly - regression check', () => {
      // An error have been thrown and too many rows have been drawn in the specific case. There haven't been done
      // index translation (from renderable to visual rows indexes and the other way around).
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(7, 1),
        rowHeaders: true, // It has to be enabled due the bug in mergeCells plugin (#4907)
        hiddenRows: {
          rows: [0, 2],
        },
        mergeCells: true
      });

      getPlugin('mergeCells').merge(3, 0, 5, 0);

      // The same as at the start.
      expect($(getHtCore()).find('td').length).toBe(5);
      // Still the same height for the whole table.
      expect(getHtCore().outerHeight()).toBe(116);
      expect(getHtCore().find('td:eq(1)').outerHeight()).toBe(69);
    });

    it('should select proper cell when calling the `selectCell` within area of merge', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        rowHeaders: true, // It has to be enabled due the bug in mergeCells plugin (#4907)
        hiddenRows: {
          rows: [0, 2],
        },
        mergeCells: [
          { row: 1, col: 0, rowspan: 4, colspan: 1 }
        ]
      });

      selectCell(1, 0);

      // Second and third rows are not displayed (CSS - display: none).
      expect(getSelected()).toEqual([[1, 0, 4, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(1);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(0);
      expect(`
        | - ║ # |
        | - ║   |
        | - ║   |
      `).toBeMatchToSelectionPattern();

      deselectCell();
      selectCell(2, 0);

      // Second and third rows are not displayed (CSS - display: none).
      expect(getSelected()).toEqual([[1, 0, 4, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(1);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(0);
      expect(`
        | - ║ # |
        | - ║   |
        | - ║   |
      `).toBeMatchToSelectionPattern();

      deselectCell();
      selectCell(3, 0);

      // Second and third rows are not displayed (CSS - display: none).
      expect(getSelected()).toEqual([[1, 0, 4, 0]]);
      expect(getSelectedRangeLast().highlight.row).toBe(1);
      expect(getSelectedRangeLast().highlight.col).toBe(0);
      expect(getSelectedRangeLast().from.row).toBe(1);
      expect(getSelectedRangeLast().from.col).toBe(0);
      expect(getSelectedRangeLast().to.row).toBe(4);
      expect(getSelectedRangeLast().to.col).toBe(0);
      expect(`
        | - ║ # |
        | - ║   |
        | - ║   |
      `).toBeMatchToSelectionPattern();

      // TODO: `selectCell(4, 0)` should give the same effect. There is bug at least from Handsontable 7.
    });
  });
});
