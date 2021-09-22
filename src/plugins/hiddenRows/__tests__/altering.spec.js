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

  describe('altering', () => {
    it('should update hidden row indexes after rows removal (removing not hidden rows)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 1),
        hiddenRows: true,
        manualRowMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenRows');

      plugin.hideRows([6, 7, 8]); // visual column indexes after move (physical indexes: 1, 7, 3)
      alter('remove_row', 2, 3); // visual column index

      expect(plugin.isHidden(3)).toBe(true); // 6 -> 3
      expect(hot.getRowHeight(3)).toBe(0);
      expect(plugin.isHidden(4)).toBe(true); // 7 -> 4
      expect(hot.getRowHeight(4)).toBe(0);
      expect(plugin.isHidden(5)).toBe(true); // 8 -> 5
      expect(hot.getRowHeight(5)).toBe(0);

      expect(plugin.isHidden(6)).toBe(false);
      expect(hot.getRowHeight(6)).toBeUndefined(); // When row height is not specyfied it fallback to 'undefined' (#2822).
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getRowHeight(7)).toBeUndefined(); // When row height is not specyfied it fallback to 'undefined' (#2822).
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getRowHeight(8)).toBeUndefined(); // When row height is not specyfied it fallback to 'undefined' (#2822).

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toBe('A5');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toBe('A1');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toBe('A7');
      expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toBe('A10');
      expect(getDataAtCol(0)).toEqual(['A5', 'A1', 'A7', 'A2', 'A8', 'A4', 'A10']);
    });

    it('should update hidden row indexes after rows removal (removing part of hidden rows)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 1),
        rowHeaders: true,
        hiddenRows: {
          indicators: true,
        },
        manualRowMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenRows');

      plugin.hideRows([6, 7, 8]); // visual row indexes after move (physical indexes: 1, 7, 3)
      alter('remove_row', 6, 2); // visual row index

      expect(plugin.isHidden(6)).toBe(true); // 8 -> 6
      expect(hot.getRowHeight(6)).toBe(0);

      expect(getCell(5, -1)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_ROW);
      expect(getCell(6, -1)).toBe(null);
      expect(getCell(7, -1)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_ROW);

      expect(plugin.isHidden(5)).toBe(false);
      expect(hot.getRowHeight(5)).toBeUndefined(); // When row height is not specyfied it fallback to 'undefined' (#2822).
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getRowHeight(7)).toBeUndefined(); // When row height is not specyfied it fallback to 'undefined' (#2822).
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getRowHeight(8)).toBeUndefined(); // When row height is not specyfied it fallback to 'undefined' (#2822).

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toBe('A5');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toBe('A1');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toBe('A9');
      expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toBe('A6');
      expect(spec().$container.find('tbody tr:eq(4) td:eq(0)').text()).toBe('A3');
      expect(spec().$container.find('tbody tr:eq(5) td:eq(0)').text()).toBe('A7');
      expect(spec().$container.find('tbody tr:eq(6) td:eq(0)').text()).toBe('A10');
      expect(getDataAtCol(0)).toEqual(['A5', 'A1', 'A9', 'A6', 'A3', 'A7', 'A4', 'A10']);
    });

    it('should update hidden row indexes after rows insertion (inserting rows before already hidden rows)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 1),
        hiddenRows: true,
        manualRowMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenRows');

      plugin.hideRows([6, 7, 8]); // visual row indexes after move (physical indexes: 1, 7, 3)
      alter('insert_row', 0, 3); // visual row index

      expect(plugin.isHidden(9)).toBe(true); // 6 -> 9
      expect(hot.getRowHeight(9)).toBe(0);
      expect(plugin.isHidden(10)).toBe(true); // 7 -> 10
      expect(hot.getRowHeight(10)).toBe(0);
      expect(plugin.isHidden(11)).toBe(true); // 8 -> 11
      expect(hot.getRowHeight(11)).toBe(0);

      expect(plugin.isHidden(6)).toBe(false);
      expect(hot.getRowHeight(6)).toBeUndefined(); // When row height is not specyfied it fallback to 'undefined' (#2822).
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getRowHeight(7)).toBeUndefined(); // When row height is not specyfied it fallback to 'undefined' (#2822).
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getRowHeight(8)).toBeUndefined(); // When row height is not specyfied it fallback to 'undefined' (#2822).

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toBe('');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toBe('');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toBe('');
      expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toBe('A5');
      expect(spec().$container.find('tbody tr:eq(4) td:eq(0)').text()).toBe('A1');
      expect(spec().$container.find('tbody tr:eq(5) td:eq(0)').text()).toBe('A9');
      expect(spec().$container.find('tbody tr:eq(6) td:eq(0)').text()).toBe('A6');
      expect(spec().$container.find('tbody tr:eq(7) td:eq(0)').text()).toBe('A3');
      expect(spec().$container.find('tbody tr:eq(8) td:eq(0)').text()).toBe('A7');
      expect(spec().$container.find('tbody tr:eq(9) td:eq(0)').text()).toBe('A10');
      expect(getDataAtCol(0)).toEqual([null, null, null, 'A5', 'A1', 'A9', 'A6', 'A3', 'A7', 'A2', 'A8', 'A4', 'A10']);
    });

    it('should update hidden row indexes after rows insertion (inserting rows between already hidden rows)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 1),
        rowHeaders: true,
        hiddenRows: {
          indicators: true,
        },
        manualRowMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenRows');

      plugin.hideRows([6, 7, 8]); // visual row indexes after move (physical indexes: 1, 7, 3)
      alter('insert_row', 7, 2); // visual row index

      expect(plugin.isHidden(6)).toBe(true);
      expect(hot.getRowHeight(6)).toBe(0);
      expect(plugin.isHidden(9)).toBe(true); // 7 -> 9
      expect(hot.getRowHeight(9)).toBe(0);
      expect(plugin.isHidden(10)).toBe(true); // 8 -> 10
      expect(hot.getRowHeight(10)).toBe(0);

      expect(getCell(5, -1)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_ROW);
      expect(getCell(6, -1)).toBe(null);
      expect(getCell(7, -1)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_ROW);
      expect(getCell(8, -1)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_ROW);
      expect(getCell(9, -1)).toBe(null);
      expect(getCell(10, -1)).toBe(null);
      expect(getCell(11, -1)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_ROW);

      expect(plugin.isHidden(5)).toBe(false);
      expect(hot.getRowHeight(5)).toBeUndefined(); // When row height is not specyfied it fallback to 'undefined' (#2822).
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getRowHeight(7)).toBeUndefined(); // When row height is not specyfied it fallback to 'undefined' (#2822).
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getRowHeight(8)).toBeUndefined(); // When row height is not specyfied it fallback to 'undefined' (#2822).
      expect(plugin.isHidden(11)).toBe(false);
      expect(hot.getRowHeight(11)).toBeUndefined(); // When row height is not specyfied it fallback to 'undefined' (#2822).

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toBe('A5');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toBe('A1');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toBe('A9');
      expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toBe('A6');
      expect(spec().$container.find('tbody tr:eq(4) td:eq(0)').text()).toBe('A3');
      expect(spec().$container.find('tbody tr:eq(5) td:eq(0)').text()).toBe('A7');
      // Hidden A2
      expect(spec().$container.find('tbody tr:eq(6) td:eq(0)').text()).toBe('');
      expect(spec().$container.find('tbody tr:eq(7) td:eq(0)').text()).toBe('');
      // Hidden A8
      expect(spec().$container.find('tbody tr:eq(8) td:eq(0)').text()).toBe('A10');
      expect(getDataAtCol(0)).toEqual(['A5', 'A1', 'A9', 'A6', 'A3', 'A7', 'A2', null, null, 'A8', 'A4', 'A10']);
    });
  });
});
