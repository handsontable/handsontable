describe('settings', () => {
  describe('nestedHeaders with rowspan', () => {
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

    it('should render header `rowspan` and hide covered headers', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        colHeaders: true,
        nestedHeaders: [
          [{ label: 'A', rowspan: 2 }, { label: 'B', colspan: 2 }],
          ['A2', 'B2', 'C2'],
        ],
      });

      expect(getCell(-2, 0).getAttribute('rowspan')).toBe('2');
      expect(getCell(-2, 1).getAttribute('colspan')).toBe('2');
      expect(getCell(-1, 0)).toHaveClass('hiddenHeader');
      expect(getCell(-1, 1)).not.toHaveClass('hiddenHeader');
      expect(getCell(-1, 2)).not.toHaveClass('hiddenHeader');
    });
  });
});
