describe('mergeCells (RTL mode)', () => {
  const id = 'test';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('merged cells selection', () => {
    it('should not change the selection after toggling the merge/unmerge state (#9362)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        mergeCells: true
      });

      selectCell(2, 2, 4, 4);
      keyDownUp(['control', 'm']);

      const mergedCell = getCell(2, 2);

      expect(mergedCell.rowSpan).toBe(3);
      expect(mergedCell.colSpan).toBe(3);
      expect(getSelected()).toEqual([[2, 2, 4, 4]]);

      keyDownUp(['control', 'm']);

      expect(mergedCell.rowSpan).toBe(1);
      expect(mergedCell.colSpan).toBe(1);
      expect(getSelected()).toEqual([[2, 2, 4, 4]]);
    });
  });
});
