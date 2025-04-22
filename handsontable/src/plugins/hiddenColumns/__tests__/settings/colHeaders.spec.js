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

  describe('colHeaders', () => {
    it('should show proper column headers for the table with hidden column', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: ['AA', 'BB', 'CC', 'DD', 'EE'],
        hiddenColumns: {
          columns: [1]
        }
      });

      expect($(getCell(-1, 0).querySelector('span')).text()).toBe('AA');
      expect(getCell(-1, 1)).toBe(null);
      expect($(getCell(-1, 2).querySelector('span')).text()).toBe('CC');
      expect($(getCell(-1, 3).querySelector('span')).text()).toBe('DD');
      expect($(getCell(-1, 4).querySelector('span')).text()).toBe('EE');
    });
  });
});
