describe('settings', () => {
  describe('stretchH', () => {
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

    it('should correctly stretch the column after changing the cell value (#dev-1727)', () => {
      const data = createSpreadsheetData(1, 5);

      data[0][4] = 'very long text is here to make the column wider';

      handsontable({
        data,
        width: 400,
        height: 300,
        stretchH: 'all',
      });

      expect(getCell(0, 4).clientWidth).toBe(258);

      setDataAtCell(0, 4, 'text');

      expect(getCell(0, 4).clientWidth).toBe(79);

      setDataAtCell(0, 4, 'very long text is here to make the column wider');

      expect(getCell(0, 4).clientWidth).toBe(258);
    });
  });
});
