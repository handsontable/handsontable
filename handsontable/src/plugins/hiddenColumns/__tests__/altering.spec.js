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

  describe('alter actions', () => {
    it('should update hidden column indexes after columns removal (removing not hidden columns)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        hiddenColumns: true,
        manualColumnMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenColumns');

      plugin.hideColumns([6, 7, 8]); // visual column indexes after move (physical indexes: 1, 7, 3)
      alter('remove_col', 2, 3); // visual column index

      expect(plugin.isHidden(3)).toBe(true); // 6 -> 3
      expect(hot.getColWidth(3)).toEqual(0);
      expect(plugin.isHidden(4)).toBe(true); // 7 -> 4
      expect(hot.getColWidth(4)).toEqual(0);
      expect(plugin.isHidden(5)).toBe(true); // 8 -> 5
      expect(hot.getColWidth(5)).toEqual(0);

      expect(plugin.isHidden(6)).toBe(false);
      expect(hot.getColWidth(6)).toEqual(50);
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getColWidth(7)).toEqual(50);
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getColWidth(8)).toEqual(50);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('E1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('G1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('J1');
      expect(getDataAtRow(0)).toEqual(['E1', 'A1', 'G1', 'B1', 'H1', 'D1', 'J1']);
    });

    it('should update hidden column indexes after columns removal (removing part of hidden columns)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          indicators: true,
        },
        manualColumnMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenColumns');

      plugin.hideColumns([6, 7, 8]); // visual column indexes after move (physical indexes: 1, 7, 3)
      alter('remove_col', 6, 2); // visual column index

      expect(plugin.isHidden(6)).toBe(true); // 8 -> 6
      expect(hot.getColWidth(6)).toEqual(0);

      expect(getCell(-1, 5)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
      expect(getCell(-1, 6)).toBe(null);
      expect(getCell(-1, 7)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);

      expect(plugin.isHidden(5)).toBe(false);
      expect(hot.getColWidth(5)).toEqual(65);
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getColWidth(7)).toEqual(65);
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getColWidth(8)).toEqual(50);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('E1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('I1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('F1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(4)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(5)').text()).toEqual('G1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(6)').text()).toEqual('J1');
      expect(getDataAtRow(0)).toEqual(['E1', 'A1', 'I1', 'F1', 'C1', 'G1', 'D1', 'J1']);
    });

    it('should update hidden column indexes after columns insertion (inserting columns before already hidden columns)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        hiddenColumns: true,
        manualColumnMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenColumns');

      plugin.hideColumns([6, 7, 8]); // visual column indexes after move (physical indexes: 1, 7, 3)
      alter('insert_col', 0, 3); // visual column index

      expect(plugin.isHidden(9)).toBe(true); // 6 -> 9
      expect(hot.getColWidth(9)).toEqual(0);
      expect(plugin.isHidden(10)).toBe(true); // 7 -> 10
      expect(hot.getColWidth(10)).toEqual(0);
      expect(plugin.isHidden(11)).toBe(true); // 8 -> 11
      expect(hot.getColWidth(11)).toEqual(0);

      expect(plugin.isHidden(6)).toBe(false);
      expect(hot.getColWidth(6)).toEqual(50);
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getColWidth(7)).toEqual(50);
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getColWidth(8)).toEqual(50);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('E1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(4)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(5)').text()).toEqual('I1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(6)').text()).toEqual('F1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(7)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(8)').text()).toEqual('G1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(9)').text()).toEqual('J1');
      expect(getDataAtRow(0)).toEqual([null, null, null, 'E1', 'A1', 'I1', 'F1', 'C1', 'G1', 'B1', 'H1', 'D1', 'J1']);
    });

    it('should update hidden column indexes after columns insertion (inserting columns between already hidden columns)', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 10),
        colHeaders: true,
        hiddenColumns: {
          indicators: true,
        },
        manualColumnMove: [4, 0, 8, 5, 2, 6, 1, 7, 3, 9]
      });

      const plugin = getPlugin('hiddenColumns');

      plugin.hideColumns([6, 7, 8]); // visual column indexes after move (physical indexes: 1, 7, 3)
      alter('insert_col', 7, 2); // visual column index

      expect(plugin.isHidden(6)).toBe(true);
      expect(hot.getColWidth(6)).toEqual(0);
      expect(plugin.isHidden(9)).toBe(true); // 7 -> 9
      expect(hot.getColWidth(9)).toEqual(0);
      expect(plugin.isHidden(10)).toBe(true); // 8 -> 10
      expect(hot.getColWidth(10)).toEqual(0);

      expect(getCell(-1, 5)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
      expect(getCell(-1, 6)).toBe(null);
      expect(getCell(-1, 7)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);
      expect(getCell(-1, 8)).toHaveClass(CSS_CLASS_BEFORE_HIDDEN_COLUMN);
      expect(getCell(-1, 9)).toBe(null);
      expect(getCell(-1, 10)).toBe(null);
      expect(getCell(-1, 11)).toHaveClass(CSS_CLASS_AFTER_HIDDEN_COLUMN);

      expect(plugin.isHidden(5)).toBe(false);
      expect(hot.getColWidth(5)).toEqual(65);
      expect(plugin.isHidden(7)).toBe(false);
      expect(hot.getColWidth(7)).toEqual(65);
      expect(plugin.isHidden(8)).toBe(false);
      expect(hot.getColWidth(8)).toEqual(65);
      expect(plugin.isHidden(11)).toBe(false);
      expect(hot.getColWidth(11)).toEqual(65);

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('E1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('I1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('F1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(4)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(5)').text()).toEqual('G1');
      // Hidden B1
      expect(spec().$container.find('tbody tr:eq(0) td:eq(6)').text()).toEqual('');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(7)').text()).toEqual('');
      // Hidden H1
      expect(spec().$container.find('tbody tr:eq(0) td:eq(8)').text()).toEqual('J1');
      expect(getDataAtRow(0)).toEqual(['E1', 'A1', 'I1', 'F1', 'C1', 'G1', 'B1', null, null, 'H1', 'D1', 'J1']);
    });
  });
});
